export class SignalMessage {
  type: string;
  sdp?: any;
  message?: string;

  constructor(data: any) {
    this.type = data.type;
    this.sdp = data.sdp;
    this.message = data.message;
  }
}

