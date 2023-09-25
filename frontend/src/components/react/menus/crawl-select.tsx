import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  //   DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { crawlCategories } from '@/lib/data/crawl-categories';

export const DropdownCrawlSelect = ({ onSelect }: { onSelect: (event: string) => void }) => {
  const crawlCategoriesList = Object.entries(crawlCategories);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          className="text-gray-800 dark:text-gray-100 font-normal"
          type="button"
        >
          Collect from Categories
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Categories</DropdownMenuLabel>
        <DropdownMenuGroup>
          {crawlCategoriesList.map((value) => {
            const [topic, topicItems] = value;

            return (
              <DropdownMenuSub key={`crawl-${topic}`}>
                <DropdownMenuSubTrigger className="capitalize">{topic}</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {Object.entries(topicItems).map((_value) => {
                      const [page, des] = _value;
                      const onSelectCrawl = () => onSelect(des);

                      return (
                        <DropdownMenuItem
                          onSelect={onSelectCrawl}
                          key={`crawl-${topic}-item-${page}`}
                        >
                          {page}
                        </DropdownMenuItem>
                      );
                    })}
                    {/* <DropdownMenuSeparator />
                    <DropdownMenuItem>Random</DropdownMenuItem> */}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
