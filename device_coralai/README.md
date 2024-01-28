# Example OOT project for Dev Board Micro

This is a "Hello World" out-of-tree project for the [Coral Dev Board
Micro](https://coral.ai/products/dev-board-micro).

This serves as a starting point for your own
Dev Board Micro projects when you want your project to live outside the
[coralmicro](https://github.com/google-coral/coralmicro) tree, rather than inside it.
For more information about creating a project, either in-tree or out-of-tree, see the guide
to [Build apps with FreeRTOS for the Dev Board Micro](https://coral.ai/docs/dev-board-micro/freertos/).

**Note:** This project depends on [coralmicro](https://github.com/google-coral/coralmicro),
which requires about 2.5 GB.

## 1. Clone this project and submodules

```bash
git clone --recurse-submodules -j8 https://github.com/google-coral/coralmicro-out-of-tree-sample
```

## 2. Build the project

```bash
cd coralmicro-out-of-tree-sample

cmake -B out -S .

make -C out -j8
```

To maximize your CPU usage, replace `-j8` with either `-j$(nproc)` on Linux or
`-j$(sysctl -n hw.ncpu)` on Mac.

## 3. Flash it to your board

```bash
python3 coralmicro/scripts/flashtool.py --build_dir out --elf_path out/coralmicro-app
```

Anytime you make changes to the code, rebuild it with the `make` command and flash it again.

**Note:** In addition to specifying the path to your project's ELF file with `elf_path`, it's
necessary to specify the build output directory with `build_dir` because flashtool needs to get
the elf_loader (bootloader) program from there.

If you followed the guide to [get started with the Dev Board
Micro](https://coral.ai/docs/dev-board-micro/get-started/), then both the `build_dir` and `elf_path`
arguments are probably new to you. That's because when flashing in-tree examples and apps (as we do
in that guide), the `build_dir` is ommitted because the flashtool uses the local `build` directory
by default. Similarly, in-tree examples and apps don't need to specify the ELF file with `elf_path`
because those files are built in the same build directory—we can instead specify just the project
name with `--example` (or `-e`) and `--app` (or `-a`) when flashing these in-tree projects.
