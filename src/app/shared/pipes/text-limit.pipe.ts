import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textLimit',
})
export class TextLimitPipe implements PipeTransform {
  transform(value: string | undefined, args: any[]): string | null {
    if (value) {
      const limit = args.length > 0 ? parseInt(args[0], 10) : 20;
      const trail = '...';
      const element: HTMLElement = args[1].parentElement;
      // CLEANUP MARKER
      // console.log(element.offsetWidth * (element.offsetHeight * 0.7) / 18);
      // console.log(element.offsetWidth)

      // console.log(589 / 75)
      // 1 char = 7.8

      // 150px height = 7 lines

      // console.log((element.offsetWidth * 7) / 10);

      const dynamicLimit = (element.offsetWidth * 7) / 8;

      return value.length > limit
        ? value.substring(0, limit) + trail
        : value;
    } else {
      return null;
    }
  }
}
