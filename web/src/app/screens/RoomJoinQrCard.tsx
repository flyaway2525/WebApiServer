import { QRCodeSVG } from 'qrcode.react';

type RoomJoinQrCardProps = {
  shareJoinLink: string;
  spaceCode: string;
  spaceName: string;
};

export function RoomJoinQrCard(props: RoomJoinQrCardProps) {
  return (
    <div className="share-panel qr-share-panel">
      <div className="qr-share-copy">
        <span className="muted-label">参加用 QR コード</span>
        <p className="muted">
          この QR を読み取ると、共有リンク経由でスペースコード {props.spaceCode} を Join Space に引き渡せます。
        </p>
      </div>
      <div className="qr-frame" aria-label={`${props.spaceName} の参加用 QR コード`}>
        <QRCodeSVG
          value={props.shareJoinLink}
          size={172}
          level="M"
          marginSize={2}
          bgColor="#fff8ef"
          fgColor="#10151a"
          includeMargin={false}
        />
      </div>
      <p className="qr-caption">読み取り先: {props.shareJoinLink}</p>
    </div>
  );
}