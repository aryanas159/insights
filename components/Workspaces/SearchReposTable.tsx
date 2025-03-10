import { CheckedState } from "@radix-ui/react-checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/shared/Table";
import { Avatar } from "components/atoms/Avatar/avatar-hover-card";
import Checkbox from "components/atoms/Checkbox/checkbox";
import Search from "components/atoms/Search/search";

interface SearchedReposTableProps {
  repositories: Map<string, boolean>;
  onFilter: (filterTerm: string) => void;
  onToggleRepo: (repo: string, checked: boolean) => void;
}

export const SearchedReposTable = ({ repositories = new Map(), onFilter, onToggleRepo }: SearchedReposTableProps) => {
  return (
    <div className="border border-light-slate-7 rounded-lg">
      <Table className="not-sr-only">
        <TableHeader>
          <TableRow className="bg-light-slate-3">
            <TableHead className="flex justify-between items-center gap-6">
              Selected repositories
              <form
                role="search"
                onSubmit={(event) => {
                  event.preventDefault;
                }}
              >
                <Search placeholder="Filter repositories" className="w-full" name="query" onChange={onFilter} />
              </form>
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>
      <div className="overflow-y-scroll h-60">
        <Table>
          <TableHeader className="sr-only">
            <TableRow className=" bg-light-slate-3">
              <TableHead>Selected repositories</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...repositories.entries()].map(([repo, checked]) => {
              const [owner] = repo.split("/");

              return (
                <TableRow key={repo}>
                  <TableCell className="flex gap-2 items-center w-full">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        onCheckedChange={(checked: CheckedState) => {
                          onToggleRepo(repo, !!checked);
                        }}
                        checked={checked}
                      />
                      <Avatar contributor={owner} size="xsmall" />
                      <span>{repo}</span>
                    </label>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
