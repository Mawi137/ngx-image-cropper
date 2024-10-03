interface NoImageSource {
  imageBase64: never;
  imageChangedEvent: never;
  imageFile: never;
  imageURL: never;
}
interface ImageBase64 {
  imageBase64?: string;
  imageChangedEvent?: never;
  imageFile?: never;
  imageURL?: never;
}
interface ImageChangedEvent {
  imageBase64?: never;
  imageChangedEvent?: Event;
  imageFile?: never;
  imageURL?: never;
}
interface ImageFile {
  imageBase64?: never;
  imageChangedEvent?: never;
  imageFile?: File;
  imageURL?: never;
}
interface ImageUrl {
  imageBase64?: never;
  imageChangedEvent?: never;
  imageFile?: never;
  imageURL?: string;
}

export type ImageSource = ImageBase64 | ImageChangedEvent | ImageFile | ImageUrl | NoImageSource;

