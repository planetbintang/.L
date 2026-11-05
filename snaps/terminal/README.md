# SNAPS Terminal

Run the first device inspection from a computer with Android Platform Tools:

```bash
bash snaps/os-installer/check-vivo-1904.sh
```

The script must be run from the repository root (or adjust the relative path). It communicates with one connected ADB device and writes the report to the computer, not to the phone.

The SNAPS web interface on GitHub Pages cannot execute host terminal commands, obtain privileged device access, unlock a bootloader, or flash an operating system. Do not paste generic fastboot commands into a terminal. Review the generated report before the next engineering step.
