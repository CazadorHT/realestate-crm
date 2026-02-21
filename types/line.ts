export type BotLang = "th" | "en" | "cn";

export interface FlexMessage {
  type: "flex";
  altText: string;
  contents: FlexContainer;
  quickReply?: QuickReply;
}

export type FlexContainer = FlexBubble | FlexCarousel;

export interface FlexBubble {
  type: "bubble";
  size?: "nano" | "micro" | "deca" | "vols" | "mega" | "giga";
  direction?: "ltr" | "rtl";
  header?: FlexBox;
  hero?: FlexImage | FlexVideo;
  body?: FlexBox;
  footer?: FlexBox;
  styles?: FlexBubbleStyles;
  action?: FlexAction;
}

export interface FlexCarousel {
  type: "carousel";
  contents: FlexBubble[];
}

export interface FlexBox {
  type: "box";
  layout: "horizontal" | "vertical" | "baseline";
  contents: FlexComponent[];
  flex?: number;
  spacing?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  paddingAll?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingStart?: string;
  paddingEnd?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  cornerRadius?: string;
  width?: string;
  height?: string;
  position?: "relative" | "absolute";
  offsetTop?: string;
  offsetBottom?: string;
  offsetStart?: string;
  offsetEnd?: string;
  action?: FlexAction;
  justifyContent?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  alignItems?: "flex-start" | "center" | "flex-end";
  background?: {
    type: "linearGradient";
    angle: string;
    startColor: string;
    endColor: string;
    centerColor?: string;
    centerPosition?: string;
  };
}

export type FlexComponent =
  | FlexBox
  | FlexButton
  | FlexImage
  | FlexIcon
  | FlexText
  | FlexSpan
  | FlexSeparator
  | FlexFiller;

export interface FlexText {
  type: "text";
  text: string;
  flex?: number;
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  size?:
    | "xxs"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "xxl"
    | "3xl"
    | "4xl"
    | "5xl";
  align?: "start" | "end" | "center";
  gravity?: "top" | "bottom" | "center";
  wrap?: boolean;
  maxLines?: number;
  weight?: "regular" | "bold";
  color?: string;
  decoration?: "none" | "underline" | "line-through";
  style?: "normal" | "italic";
  contents?: FlexSpan[];
  action?: FlexAction;
}

export interface FlexSpan {
  type: "span";
  text: string;
  size?:
    | "xxs"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "xxl"
    | "3xl"
    | "4xl"
    | "5xl";
  weight?: "regular" | "bold";
  color?: string;
  decoration?: "none" | "underline" | "line-through";
  style?: "normal" | "italic";
}

export interface FlexImage {
  type: "image";
  url: string;
  flex?: number;
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  align?: "start" | "end" | "center";
  gravity?: "top" | "bottom" | "center";
  size?:
    | "xxs"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "xxl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "full";
  aspectRatio?: string;
  aspectMode?: "cover" | "fit";
  backgroundColor?: string;
  action?: FlexAction;
  animated?: boolean;
}

export interface FlexVideo {
  type: "video";
  url: string;
  previewUrl: string;
  altContent: FlexImage | FlexBox;
  aspectRatio?: string;
  action?: FlexAction;
}

export interface FlexButton {
  type: "button";
  action: FlexAction;
  flex?: number;
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  height?: "sm" | "md";
  style?: "link" | "primary" | "secondary";
  color?: string;
  gravity?: "top" | "bottom" | "center";
  adjustMode?: "shrink-to-fit";
}

export interface FlexIcon {
  type: "icon";
  url: string;
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  size?:
    | "xxs"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "xxl"
    | "3xl"
    | "4xl"
    | "5xl";
  aspectRatio?: string;
  position?: "relative" | "absolute";
  offsetTop?: string;
  offsetBottom?: string;
  offsetStart?: string;
  offsetEnd?: string;
}

export interface FlexSeparator {
  type: "separator";
  margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  color?: string;
}

export interface FlexFiller {
  type: "filler";
  flex?: number;
}

export interface FlexBubbleStyles {
  header?: FlexBlockStyle;
  hero?: FlexBlockStyle;
  body?: FlexBlockStyle;
  footer?: FlexBlockStyle;
}

export interface FlexBlockStyle {
  backgroundColor?: string;
  separator?: boolean;
  separatorColor?: string;
}

export type FlexAction =
  | {
      type: "postback";
      label?: string;
      data: string;
      displayText?: string;
      text?: string;
      inputOption?: "showKeyboard" | "openKeyboard" | "closeKeyboard";
      fillInText?: string;
    }
  | { type: "message"; label?: string; text: string }
  | { type: "uri"; label?: string; uri: string; altUri?: { desktop: string } }
  | {
      type: "datetimepicker";
      label?: string;
      data: string;
      mode: "date" | "time" | "datetime";
      initial?: string;
      max?: string;
      min?: string;
    }
  | { type: "camera"; label: string }
  | { type: "cameraRoll"; label: string }
  | { type: "location"; label: string }
  | {
      type: "richmenuswitch";
      label?: string;
      richMenuAliasId: string;
      data: string;
    };

export interface QuickReply {
  items: QuickReplyItem[];
}

export interface QuickReplyItem {
  type: "action";
  imageUrl?: string;
  action: FlexAction;
}
