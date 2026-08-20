"use client";
export default function UploadStatus({message}:{message:string}){if(!message)return null;const positive=/成功|已提交|已发布|等待审核/.test(message);return <p aria-live="assertive" className={`mt-4 rounded-xl p-3 text-sm font-medium ${positive?"bg-green-50 text-green-700":"bg-red-50 text-red-700"}`}>{message}</p>}
