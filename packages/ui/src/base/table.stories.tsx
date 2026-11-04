import type { Meta, StoryObj } from "@storybook/react-vite"

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./table"

/* Base = upstream shadcn, unedited (R1-22). Paige code uses Components/Display/DataTable. */
const meta = { component: Table } satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Recent job runs</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Pipeline</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Duration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Nightly usage report</TableCell>
          <TableCell>Succeeded</TableCell>
          <TableCell className="text-right">42s</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Stripe sync</TableCell>
          <TableCell>Failed</TableCell>
          <TableCell className="text-right">3s</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}
