default: assets pelican

pelican:
  pelican

serve:
  pelican --listen --autoreload

typecheck:
  cd asset-generator && tsc

assets: typecheck
  rm -Rf content/images
  rm -Rf content/js
  cd asset-generator && node dist/index.js && webpack --mode production
  cp -r asset-generator/static/. content/images
  cp -r asset-generator/web-bundles/. content/js

test:
  cd asset-generator && npx jest

examine:
  git -C output status

examine-diff:
  git -C output diff

clean:
  git -C output reset --hard HEAD
