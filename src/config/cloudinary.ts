import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const CLOUDINARY_ROOT_FOLDER = "kamran-carpets";

export const CLOUDINARY_FOLDERS = {
  products: `${CLOUDINARY_ROOT_FOLDER}/products`,
  categories: `${CLOUDINARY_ROOT_FOLDER}/categories`,
  collections: `${CLOUDINARY_ROOT_FOLDER}/collections`,
  blogs: `${CLOUDINARY_ROOT_FOLDER}/blogs`,
  banners: `${CLOUDINARY_ROOT_FOLDER}/banners`,
  logos: `${CLOUDINARY_ROOT_FOLDER}/logos`,
  users: `${CLOUDINARY_ROOT_FOLDER}/users`,
} as const;

export default cloudinary;
