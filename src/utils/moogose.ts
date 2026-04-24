import { IdPInfo } from './../../node_modules/mongodb/src/cmap/auth/mongodb_oidc';
import { S3 } from "@aws-sdk/client-s3";
import mongoose from "mongoose";


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test');

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

async function findS3ById(id:number,minytype:string) {
    const s3Object = await S3Object.findOne({ idUsuario: id, minytype: minytype });
    return s3Object;
}

