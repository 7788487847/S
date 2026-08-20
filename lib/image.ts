export type ArtworkImages={imageUrl?:string|null;thumbnailUrl?:string|null;displayUrl?:string|null;originalUrl?:string|null;images?:string|null;imageVariants?:string|null};
type Variant={thumbnailUrl?:string;displayUrl?:string;originalUrl?:string};
function parseArray(value:string|null|undefined):unknown[]{if(!value)return[];try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[]}catch{return[]}}
function strings(values:unknown[]){return [...new Set(values.filter((value):value is string=>typeof value==="string"&&value.length>0))]}
export function getArtworkVariants(artwork:ArtworkImages):Variant[]{return parseArray(artwork.imageVariants).filter((value):value is Variant=>Boolean(value)&&typeof value==="object")}
export function getArtworkDisplay(artwork:ArtworkImages){return artwork.displayUrl||artwork.thumbnailUrl||artwork.imageUrl||""}
export function getArtworkThumbnail(artwork:ArtworkImages){return artwork.thumbnailUrl||artwork.imageUrl||""}
export function getArtworkOriginal(artwork:ArtworkImages){return artwork.originalUrl||artwork.displayUrl||artwork.thumbnailUrl||artwork.imageUrl||""}
export function getArtworkDisplays(artwork:ArtworkImages){const variants=getArtworkVariants(artwork),fromVariants=strings(variants.map(item=>item.displayUrl||item.thumbnailUrl));if(fromVariants.length)return fromVariants;const fromImages=strings(parseArray(artwork.images));return fromImages.length?fromImages:[getArtworkDisplay(artwork)].filter(Boolean)}
export function getArtworkOriginals(artwork:ArtworkImages){const variants=getArtworkVariants(artwork),originals=strings(variants.map(item=>item.originalUrl||item.displayUrl));return originals.length?originals:[getArtworkOriginal(artwork)].filter(Boolean)}
export function getArtworkAllUrls(artwork:ArtworkImages){const variants=getArtworkVariants(artwork);return strings([artwork.imageUrl,artwork.thumbnailUrl,artwork.displayUrl,artwork.originalUrl,...parseArray(artwork.images),...variants.flatMap(item=>[item.thumbnailUrl,item.displayUrl,item.originalUrl])])}
export function countArtworkImages(artwork:ArtworkImages){const variants=getArtworkVariants(artwork);if(variants.length)return variants.length;const images=strings(parseArray(artwork.images));if(images.length)return images.length;return getArtworkDisplay(artwork)?1:0}
