import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2Icon, PlusCircleIcon } from 'lucide-react';

const AddonRender = ({ addon }: { addon?: boolean }) => {
  return (
    <>
      {addon ? (
        <>
          <span className="sr-only">Extra</span>
          <PlusCircleIcon />
        </>
      ) : (
        <>
          <span className="sr-only">Default</span>
          <CheckCircle2Icon />
        </>
      )}
    </>
  );
};

export const PricingTable = () => {
  return (
    <Table>
      <TableCaption>Features and Cost Comparison</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Addon</TableHead>
          <TableHead>Features</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">
            <AddonRender />
          </TableCell>
          <TableCell>Scraping Websites</TableCell>
          <TableCell className="text-right">$0.01 / gb</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">
            <AddonRender />
          </TableCell>
          <TableCell>Data Storage</TableCell>
          <TableCell className="text-right">$0.06 / gb / month</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">
            <AddonRender />
          </TableCell>
          <TableCell>ML Vectorization</TableCell>
          <TableCell className="text-right">$0.003 / resource</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">
            <AddonRender />
          </TableCell>
          <TableCell>AI Chat</TableCell>
          <TableCell className="text-right">$0.05 input/output</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">
            <AddonRender addon />
          </TableCell>
          <TableCell>Premium Proxies</TableCell>
          <TableCell className="text-right">$0.01 / gb bandwidth</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">
            <AddonRender addon />
          </TableCell>
          <TableCell>Headless Browser</TableCell>
          <TableCell className="text-right">$0.02 / gb bandwidth</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
