import crypto from "node:crypto";

function encryptionKey() {
  const raw = process.env.PERSONAL_DATA_SECRET || process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-personal-data-secret-change-me");
  if (!raw) throw new Error("PERSONAL_DATA_SECRET_NOT_CONFIGURED");
  return crypto.createHash("sha256").update(raw).digest();
}
export function encryptPersonal(value:string){if(!value)return"";const key=encryptionKey(),iv=crypto.randomBytes(12),cipher=crypto.createCipheriv("aes-256-gcm",key,iv),output=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return`enc:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${output.toString("base64")}`}
export function decryptPersonal(value:string|null|undefined){if(!value)return"";if(!value.startsWith("enc:"))return value;try{const key=encryptionKey(),[,iv,tag,data]=value.split(":"),decipher=crypto.createDecipheriv("aes-256-gcm",key,Buffer.from(iv,"base64"));decipher.setAuthTag(Buffer.from(tag,"base64"));return Buffer.concat([decipher.update(Buffer.from(data,"base64")),decipher.final()]).toString("utf8")}catch{return""}}
export function blindIndex(value:string){return crypto.createHmac("sha256",encryptionKey()).update(value.trim().toLowerCase()).digest("hex")}
