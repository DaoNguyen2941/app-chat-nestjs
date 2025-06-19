import { ApiProperty } from "@nestjs/swagger";
import { PageMetaDtoParameters } from "../interface/IPageMetaParameters";

export class PageMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  itemCount: number;

  @ApiProperty()
  pageCount: number;

  @ApiProperty()
  hasPreviousPage: boolean;

  @ApiProperty()
  hasNextPage: boolean;

  constructor({ pageOptionsDto, itemCount }: PageMetaDtoParameters) {
    this.page = pageOptionsDto.page ?? 1;
    this.take = pageOptionsDto.take ?? 10;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}
