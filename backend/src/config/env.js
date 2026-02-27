import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://root:root@cluster0.u5wfops.mongodb.net/?appName=Cluster0";
export const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "pujari-70dba";
export const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDNWiWdYlkLQRoU\nKpBiUs4gqNzz2g06r928IgJc+nAxjrl71E5ORT7ZATIh9lS0ST5J/vJ/ZWKBhBaw\n2oU5uXfmjR7l39OO9FS3d8t7MMPT6yr6RB6xhqWXiAKkOwYgFqV82e9wqwIKql8S\n4vGBMykEqcFdgJgPRIFhjq73f2poDJO2Jy0UEzOSUusc5gjpxilxuulxeBlnB1/v\n5XO2spQt12ry99+DMtV+8zivSvGoa088ZmLFjsHr6tEcjN1mWxerysr0AlLXqQgg\n2OdKGd/49i0FiYKLmn26aggiKK6xnIvZyMTZ3GOJi6GseV0w2fIt7lQ7VqAUH/xe\nzcuuHdkzAgMBAAECgf9Y1riQkNvOvKlPLljcSg5dU+6I3lcHV2DKk+jRONHvzL9D\nv/GuDeE6ctxG803BuSjriSVvvqFADDYRKCv+u5c4Qbh1UYkk/JiVPHEcgvkaOseM\nwi5oi8l9igDFe1KdjaQ9Qp2zJtD+FV9bsujkuv9U7UN90KHIgd9Xe3LVZq5BAEzR\nt7JlhzfLzErK4bhj+iOT96sEmCrPr7fyRF/xHIs6YxcajBoLVq36CipCfhuQzl5D\ngb5O/6MpWMr1rQmOT4EeZkEqkuZj3fwOBk+OF7XqSbbm50Uyml2gtW/ggzynfu2A\n7NDMWDMdCbijpTv3ULk1BTnxtXAzwLQ7DJsGfskCgYEA7H/gJBPsP8kFAVu/8T3D\nyNy2oceoVwnAEb4R75QIT324hMzFSfYat6ohN8Djd+Pw1jl1CwXUC84RXz5LDXX3\nQ4U7eYYIyg58kEjiIAzKveZSnnygGT0rf81bTWwu4NFp//aSlHFpvyuA2q5g55LQ\nIvuvdUVbzFn2w7iYjA/sQhUCgYEA3kjM4mdKJGVtwQXGgoFABc/K24CpJDtNt/5J\n/pshdRrEMBLDaq14h8oc3RQqLu7qftZD83YOkQVzRV7rAJceLDcBcMi8CJqFQvmU\nw9iyKCC2TTsXA1bEMM4anFsRkxI7aK96n5Flqw/Dj535iiuIwP7dfYejYnDfNlyc\nJok6qCcCgYEA4kXKvtns7G45Ar6022w72P8LIag0MOpcQN14rZ8VgHCJzU1Z6VS0\n5Uq6M2yyde+5ak1Y5W3zHkRPrK+eAUf/hjN/3tpVqHTJywZgi0eR5rTqEUatqtgy\nuTlShLXf+CuEXmicf7gu87/8rb2va4C08PObQPlWRiNBDKueEEvfwK0CgYADX/GU\nYmMSyGNxMchAxPu2v/Gc16eCTR13at77RkF8SEXZcGHxhh1X1Eu3haB3ei7gj9H\n2/v+oamNXRKOUL0JiNBByRppuwbY7HcgvhJ+X3jFFWeVCmUyJH7s7skGhZlXToq7\nD3cOsM+UR565RU3vOC9er4eAgBwzdBZ+00iLswKBgAdjwehjclYPQ1BFnE8AcS4F\nDms7xFoblwoQ1W5KrEJaJhRVcVGl7Qu9prw8TBwmHeX9J5BPMqXNK/z+G1hHxSt3\ndWiRotTumESrEK0z7katbx28FOWbHS39yEMqsGlKzhmgogMBnFvyZBeebY9/TP9F\nhvs8SeiKzjWnlLx82kHO\n-----END PRIVATE KEY-----\n";
export const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@pujari-70dba.iam.gserviceaccount.com";
export const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyCeLVXkF2p6Egjvnn91450jf6rfESvq8g0";

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;