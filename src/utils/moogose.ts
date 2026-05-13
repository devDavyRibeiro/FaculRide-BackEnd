import mongoose from "mongoose";
import { env } from 'process';


main().catch(err => console.log(err));

async function main() {
    let mongoUri:string
    if(!env.MONGODB_URI_USER || !env.MONGODB_URI_END || !env.MONGODB_HOST_DEV || !env.MONGODB_HOST_PROD) {
        return Promise.reject("❌ MONGODB_URI_USER ou MONGODB_URI_END não definidos no .env");
    }
    if(env.NODE_ENV === "dev") {
        mongoUri = `${env.MONGODB_URI_USER}${env.MONGODB_HOST_DEV}${env.MONGODB_URI_END}`;
        console.log(`🔗 Conectando ao MongoDB em: ${mongoUri}`);
    } else {
        mongoUri = `${env.MONGODB_URI_USER}${env.MONGODB_HOST_PROD}${env.MONGODB_URI_END}`;
        console.log(`🔗 Conectando ao MongoDB em: ${mongoUri}`);
    }
    await mongoose.connect(mongoUri);

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

mongoose.connection.on("connected", () => {
  console.log("Mongoose conectado ao MongoDB");
});

const s3ObjectSchema = new mongoose.Schema({
    idUsuario: { type: Number, required: true },
    key: { type: String, required: true },
    minytype: { type: String, required: true },
});

const S3Object = mongoose.model("S3Object", s3ObjectSchema);

export async function insertS3(id:number,key:string,minytype:string): Promise<boolean> {
    const s3Object = new S3Object({
        idUsuario: id,
        key: key,
        minytype: minytype,
    });
    const savedS3Object = await s3Object.save();
    return savedS3Object === savedS3Object 
}

export async function findS3ById(id:number,minytype?:string) {
    const s3Object = await S3Object.findOne({ idUsuario: id, minytype: minytype });
    return s3Object;
}

export async function deleteS3ById(id:number, minytype:string): Promise<boolean> {
    const result = await S3Object.deleteOne({ idUsuario: id, minytype: minytype });
    return result.deletedCount > 0;
}

