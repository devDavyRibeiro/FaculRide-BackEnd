import mongoose from "mongoose";
import { env } from 'process';
import { getEc2Dns } from "./ec2";


main().catch(err => console.log(err));

async function main() {
    const dns = await getEc2Dns();
    if(!dns) {
        return Promise.reject("❌ Não foi possível obter o DNS da EC2. Verifique os logs anteriores.");
    }
    if(!env.MONGODB_URI_USER || !env.MONGODB_URI_END) {
        return Promise.reject("❌ MONGODB_URI_USER ou MONGODB_URI_END não definidos no .env");
    }
    const mongoUri = env.MONGODB_URI_USER! + dns + env.MONGODB_URI_END;
    console.log(`🔗 Conectando ao MongoDB em: ${mongoUri}`);
    await mongoose.connect(mongoUri);

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

mongoose.connection.on("connected", () => {
  console.log("Mongoose conectado ao MongoDB");
});

const s3ObjectSchema = new mongoose.Schema({
    idUsuario: { type: Number, required: true },
    etag: { type: String, required: true },
    minytype: { type: String, required: true },
});

const S3Object = mongoose.model("S3Object", s3ObjectSchema);

export async function insertS3(id:number,etag:string,minytype:string): Promise<boolean> {
    const s3Object = new S3Object({
        idUsuario: id,
        etag: etag,
        minytype: minytype,
    });
    const savedS3Object = await s3Object.save();
    return savedS3Object === savedS3Object 
}

export async function findS3ById(id:number,minytype:string) {
    const s3Object = await S3Object.findOne({ idUsuario: id, minytype: minytype });
    return s3Object;
}

