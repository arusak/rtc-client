import * as moment from 'moment';
import {Moment} from 'moment';

export class ChatMessage {
  text: string;
  type: string;
  timestamp: Moment;
  senderId: string;

  local: boolean;
  hidden: boolean;

  constructor(data: any) {
    this.text = data.text;
    this.type = data.type;
    this.senderId = data.senderId;
    this.timestamp = moment(data.timestamp);
    this.local = data.local;
  }
}
