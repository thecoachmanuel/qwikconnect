const fs = require('fs');
const path = require('path');

const sqlPath = path.resolve(__dirname, '../../database.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Match CREATE TABLE
const tableRegex = /CREATE TABLE `(\w+)` \(([\s\S]*?)\) ENGINE=/g;
let match;
const tables = {};

while ((match = tableRegex.exec(sql)) !== null) {
  const tableName = match[1];
  const body = match[2];
  tables[tableName] = { columns: [], primaryKeys: [], uniqueKeys: [], autoIncrements: new Set() };

  const lines = body.split('\n').map(l => l.trim().replace(/,$/, '')).filter(Boolean);
  for (const line of lines) {
    const colMatch = line.match(/^`(\w+)`\s+([a-zA-Z0-9_]+(?:\([0-9,]+\))?)(.*)$/i);
    if (colMatch) {
      const colName = colMatch[1];
      const rawType = colMatch[2].toLowerCase();
      const rest = colMatch[3] || '';
      const unsigned = rest.includes('UNSIGNED');
      const notNull = rest.includes('NOT NULL');
      const isAutoIncrement = rest.includes('AUTO_INCREMENT');
      const defMatch = rest.match(/DEFAULT\s+('([^']*)'|NULL|[0-9.]+|CURRENT_TIMESTAMP)/i);
      const defaultVal = defMatch ? (defMatch[2] !== undefined ? defMatch[2] : defMatch[1]) : null;

      if (isAutoIncrement) {
        tables[tableName].autoIncrements.add(colName);
      }

      tables[tableName].columns.push({
        name: colName,
        rawType,
        unsigned,
        nullable: !notNull,
        defaultVal
      });
    }
  }
}

// Match ALTER TABLE ADD PRIMARY KEY & UNIQUE KEY
const alterRegex = /ALTER TABLE `(\w+)`([\s\S]*?);/g;
while ((match = alterRegex.exec(sql)) !== null) {
  const tableName = match[1];
  const alterBody = match[2];
  if (tables[tableName]) {
    const pkMatch = alterBody.match(/ADD PRIMARY KEY \(([^)]+)\)/);
    if (pkMatch) {
      tables[tableName].primaryKeys = pkMatch[1].split(',').map(k => k.trim().replace(/`/g, ''));
    }
    const uqMatches = [...alterBody.matchAll(/ADD UNIQUE KEY `?(\w+)`?\s*\(([^)]+)\)/g)];
    for (const uq of uqMatches) {
      tables[tableName].uniqueKeys.push({
        name: uq[1],
        columns: uq[2].split(',').map(k => k.trim().replace(/`/g, ''))
      });
    }
    // Also check MODIFY for AUTO_INCREMENT
    const aiMatches = [...alterBody.matchAll(/MODIFY `(\w+)`[^;]+AUTO_INCREMENT/gi)];
    for (const ai of aiMatches) {
      tables[tableName].autoIncrements.add(ai[1]);
    }
  }
}

// Map table name to PascalCase ModelName
function toModelName(tbl) {
  const map = {
    'users': 'User',
    'admins': 'Admin',
    'admin_roles': 'AdminRole',
    'admin_notices': 'AdminNotice',
    'admin_notifications': 'AdminNotification',
    'admin_commissions': 'AdminCommission',
    'accountdeactives': 'AccountDeactive',
    'amount_settings': 'AmountSetting',
    'blogs': 'Blog',
    'blog_comments': 'BlogComment',
    'brands': 'Brand',
    'buyer_jobs': 'BuyerJob',
    'categories': 'Category',
    'category_zones': 'CategoryZone',
    'child_categories': 'ChildCategory',
    'countries': 'Country',
    'custom_font_imports': 'CustomFontImport',
    'days': 'Day',
    'edit_service_histories': 'EditServiceHistory',
    'extra_services': 'ExtraService',
    'failed_jobs': 'FailedJob',
    'favourite_services': 'FavouriteService',
    'form_builders': 'FormBuilder',
    'job_requests': 'JobRequest',
    'job_request_conversations': 'JobRequestConversation',
    'languages': 'Language',
    'live_chat_messages': 'LiveChatMessage',
    'media_uploads': 'MediaUpload',
    'menus': 'Menu',
    'meta_data': 'MetaData',
    'migrations': 'Migration',
    'model_has_permissions': 'ModelHasPermission',
    'model_has_roles': 'ModelHasRole',
    'notifications': 'Notification',
    'online_service_faqs': 'OnlineServiceFaq',
    'orders': 'Order',
    'order_additionals': 'OrderAdditional',
    'order_booking_date_time_changes': 'OrderBookingDateTimeChange',
    'order_complete_declines': 'OrderCompleteDecline',
    'order_includes': 'OrderInclude',
    'pages': 'Page',
    'page_builders': 'PageBuilder',
    'password_resets': 'PasswordReset',
    'payout_requests': 'PayoutRequest',
    'permissions': 'Permission',
    'personal_access_tokens': 'PersonalAccessToken',
    'reports': 'Report',
    'report_chat_messages': 'ReportChatMessage',
    'reviews': 'Review',
    'roles': 'Role',
    'role_has_permissions': 'RoleHasPermission',
    'schedules': 'Schedule',
    'seller_subscriptions': 'SellerSubscription',
    'seller_verifies': 'SellerVerify',
    'seller_view_jobs': 'SellerViewJob',
    'serviceadditionals': 'ServiceAdditional',
    'servicebenifits': 'ServiceBenefit',
    'serviceincludes': 'ServiceInclude',
    'services': 'Service',
    'service_areas': 'ServiceArea',
    'service_cities': 'ServiceCity',
    'service_coupons': 'ServiceCoupon',
    'sliders': 'Slider',
    'social_icons': 'SocialIcon',
    'static_options': 'StaticOption',
    'subcategories': 'SubCategory',
    'subscriptions': 'Subscription',
    'subscription_coupons': 'SubscriptionCoupon',
    'subscription_histories': 'SubscriptionHistory',
    'support_tickets': 'SupportTicket',
    'support_ticket_messages': 'SupportTicketMessage',
    'tags': 'Tag',
    'taxes': 'Tax',
    'to_do_lists': 'TodoList',
    'user_unique_keys': 'UserUniqueKey',
    'wallets': 'Wallet',
    'wallet_histories': 'WalletHistory',
    'widgets': 'Widget',
    'xg_ftp_infos': 'XgFtpInfo',
    'xg_payment_meta': 'XgPaymentMeta',
    'zones': 'Zone',
    'zone_users': 'ZoneUser'
  };

  if (map[tbl]) return map[tbl];
  return tbl.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function mapType(col, isPk) {
  const t = col.rawType;
  if (t.startsWith('bigint')) {
    return { type: 'BigInt', native: col.unsigned ? '@db.UnsignedBigInt' : '@db.BigInt' };
  }
  if (t.startsWith('tinyint(1)')) {
    return { type: 'Int', native: '@db.TinyInt' };
  }
  if (t.startsWith('tinyint')) {
    return { type: 'Int', native: '@db.TinyInt' };
  }
  if (t.startsWith('smallint')) {
    return { type: 'Int', native: '@db.SmallInt' };
  }
  if (t.startsWith('int')) {
    return { type: 'Int', native: col.unsigned ? '@db.UnsignedInt' : '@db.Int' };
  }
  if (t.startsWith('decimal') || t.startsWith('double') || t.startsWith('float')) {
    return { type: 'Decimal', native: '@db.Decimal(10, 2)' };
  }
  if (t.startsWith('varchar') || t.startsWith('char')) {
    return { type: 'String', native: '@db.VarChar(191)' };
  }
  if (t.startsWith('longtext')) {
    return { type: 'String', native: '@db.LongText' };
  }
  if (t.startsWith('mediumtext')) {
    return { type: 'String', native: '@db.MediumText' };
  }
  if (t.startsWith('text')) {
    return { type: 'String', native: '@db.Text' };
  }
  if (t.startsWith('timestamp') || t.startsWith('datetime')) {
    return { type: 'DateTime', native: t.startsWith('datetime') ? '@db.DateTime(0)' : '@db.Timestamp(0)' };
  }
  if (t.startsWith('date')) {
    return { type: 'DateTime', native: '@db.Date' };
  }
  if (t.startsWith('time')) {
    return { type: 'String', native: '@db.VarChar(50)' };
  }
  if (t.startsWith('json')) {
    return { type: 'Json', native: '' };
  }
  return { type: 'String', native: '@db.Text' };
}

let prismaSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
`;

for (const tableName of Object.keys(tables).sort()) {
  const tbl = tables[tableName];
  const modelName = toModelName(tableName);
  prismaSchema += `\nmodel ${modelName} {\n`;

  const pks = tbl.primaryKeys;
  const isSinglePk = pks.length === 1;

  for (const col of tbl.columns) {
    const isPk = isSinglePk && pks[0] === col.name;
    const { type, native } = mapType(col, isPk);
    const isNullable = col.nullable && !isPk;

    let fieldLine = `  ${col.name} ${type}${isNullable ? '?' : ''}`;

    const attrs = [];
    if (isPk) {
      attrs.push('@id');
      if (tbl.autoIncrements.has(col.name) || (type === 'BigInt' || type === 'Int')) {
        attrs.push('@default(autoincrement())');
      }
    } else if (col.defaultVal !== null) {
      if (col.defaultVal === 'CURRENT_TIMESTAMP') {
        attrs.push('@default(now())');
      } else if (type === 'Int') {
        const n = parseInt(col.defaultVal, 10);
        if (!isNaN(n)) attrs.push(`@default(${n})`);
      } else if (type === 'BigInt') {
        const n = parseInt(col.defaultVal, 10);
        if (!isNaN(n)) attrs.push(`@default(${n})`);
      } else if (type === 'Decimal') {
        const f = parseFloat(col.defaultVal);
        if (!isNaN(f)) attrs.push(`@default(${f})`);
      } else if (type === 'String' && col.defaultVal !== 'NULL') {
        attrs.push(`@default("${col.defaultVal.replace(/"/g, '\\"')}")`);
      }
    }

    if (native) {
      attrs.push(native);
    }

    if (attrs.length > 0) {
      fieldLine += ' ' + attrs.join(' ');
    }

    prismaSchema += fieldLine + '\n';
  }

  // Composite primary keys
  if (pks.length > 1) {
    prismaSchema += `  @@id([${pks.join(', ')}])\n`;
  } else if (pks.length === 0) {
    if (tableName === 'password_resets') {
      prismaSchema += `  @@id([email, token])\n`;
    }
  }

  prismaSchema += `  @@map("${tableName}")\n`;
  prismaSchema += `}\n`;
}

const outPath = path.resolve(__dirname, '../prisma/schema.prisma');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, prismaSchema, 'utf8');

console.log(`Successfully generated prisma/schema.prisma with ${Object.keys(tables).length} models!`);
