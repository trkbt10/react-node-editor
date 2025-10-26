# Scripts

このディレクトリには、プロジェクトのメンテナンスとビルドプロセスを支援するスクリプトが含まれています。

## generate-theme-exports.ts

テーマファイルのexportsをpackage.jsonに自動生成するスクリプトです。

### 使用方法

```bash
bun run generate:theme-exports
```

### 動作

1. `public/themes/` ディレクトリ内の全ての `.css` ファイルをスキャン
2. 各テーマファイルに対して、package.jsonの `exports` フィールドに以下の形式でエントリを追加:
   ```json
   "./themes/[theme-name].css": "./public/themes/[theme-name].css"
   ```
3. 既存のexports（テーマ以外）は保持され、テーマのexportsのみが更新される

### 実行タイミング

以下の場合にこのスクリプトを実行してください:

- 新しいテーマファイルを `public/themes/` に追加した時
- テーマファイルの名前を変更した時
- テーマファイルを削除した時

### 注意事項

- ワイルドカード (`./themes/*`) はNode.jsのパッケージ解決で正しく動作しないため、各テーマを個別にexportsに登録する必要があります
- スクリプトは自動的にテーマをアルファベット順にソートします
- `./style.css` の直後にテーマのexportsが挿入されます
