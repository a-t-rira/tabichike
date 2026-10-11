# たびチケ Promo

Instagram リール用の18秒動画、リールカバー、フィード投稿用カルーセル画像を Remotion で制作しています。アプリ本体のコードは変更していません。

## 書き出し

Node.js 18 以上が必要です。`promo/` で依存を入れて、すべてを書き出します。

```sh
npm install
npm run render:all
```

個別の書き出しは `npm run render:reel`、`npm run render:cover`、`npm run render:posts` です。出力は `promo/out/` に保存されます。

## 文言と秒数

コピーとシーンの開始フレーム・長さは `promo/src/copy.ts` にまとまっています。30フレームで1秒です。シーンの絵は `promo/src/scenes/`、フィード画像のレイアウトは `promo/src/stills/PromoPost.tsx` で調整できます。

## 出力

- `out/tabichike-reel.mp4` — 1080×1920、30fps、18秒、無音、H.264
- `out/reel-cover.png` — 1080×1920
- `out/post-01.png` 〜 `out/post-06.png` — 1080×1350
