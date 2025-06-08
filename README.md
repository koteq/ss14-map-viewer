# Space Station 14 map viewer fork

Renders Space Station 14 maps with GitHub Actions and publishes them to GitHub Pages.

## How to build/render/use

```console
$ git clone --recurse-submodules --depth 1 --shallow-submodules https://github.com/{ss14-fork-of-your-choose} ss14
$ git -C ss14 apply ../patches/map-renderer.patch
# If the patch fails, you may need to `git fetch --unshallow` and `git apply --3way` it, fixing any conflicts manually.
$ dotnet build ss14/Content.MapRenderer --configuration Release
$ ss14/bin/Content.MapRenderer/Content.MapRenderer --viewer "MapName"
```
