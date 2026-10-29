import PusherServer from 'pusher';

export const pusherServer =
  process.env.PUSHER_APP_ID && process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.PUSHER_APP_SECRET
    ? new PusherServer({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.NEXT_PUBLIC_PUSHER_KEY,
        secret: process.env.PUSHER_APP_SECRET,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
        useTLS: true,
      })
    : null;
