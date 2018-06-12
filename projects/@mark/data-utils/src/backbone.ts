import * as redisConnect from './redisConnect';
import * as redis from 'redis';
export function announce(channel: string, message: string): Promise<void> {
    return new Promise((resolve, reject) => {

        redisConnect.instance()
            .then(redisClient => {
                redisClient.publish(channel, message, (error: Error, reply: number) => {
                    if (error) {
                        return reject(error);
                    } else {
                        resolve();
                    }
                });
            });
    });
}

export function subscribe(...channels: any[]): Promise<redis.RedisClient> {
    // return new Promise((resolve, reject) => {
    return redisConnect.subscriber()
        .then(redisClient => {

            // redisClient.on('subscribe', (channel: string, message: string) => {
            //     resolve(redisClient);
            // });

            // redisClient.on('subscribe', (channel: string, message: string) => {
            //     resolve(redisClient);
            // });

            redisClient.subscribe(...channels);
            return Promise.resolve(redisClient);

        });
    // });
}

export function psubscribe(...channels: any[]): Promise<redis.RedisClient> {
    // return new Promise((resolve, reject) => {
    return redisConnect.subscriber()
        .then(redisClient => {

            // redisClient.on('subscribe', (channel: string, message: string) => {
            //     resolve(redisClient);
            // });

            // redisClient.on('subscribe', (channel: string, message: string) => {
            //     resolve(redisClient);
            // });

            redisClient.psubscribe(...channels);
            return Promise.resolve(redisClient);

        });
    // });
}
