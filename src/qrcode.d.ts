declare module 'qrcode' {
  type CanvasOptions = {
    margin?: number;
    width?: number;
    color?: { dark: string; light: string };
  };
  const QRCode: {
    toCanvas(canvas: HTMLCanvasElement, text: string, options?: CanvasOptions): Promise<HTMLCanvasElement>;
  };
  export default QRCode;
}