import { Files } from "../entity/file.entity";

export interface IStorageService {
  uploadFile(file: Express.Multer.File, key?: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getUserAvatar(userId:string): Promise<Files | null>;
  uploadImage(file: Express.Multer.File, key?: string) : Promise<string> 
}
