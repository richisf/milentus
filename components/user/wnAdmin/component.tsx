"use client";

import { useQuery } from "convex/react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { CreateCodeForm } from "./action/create/component";

export function WnAdmin() {
  const allCodes = useQuery(api.wnAdmin.query.all_codes.allCodes);

  return (
    <div className="max-w-xl mx-auto pl-4">
        <Card className="m-0 p-0">
          <CardContent className="p-0 m-0">
          <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-left hover:bg-transparent p-0 pl-4 text-lg">Code</TableHead>
                  <TableHead className="text-left hover:bg-transparent p-0 text-lg">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Existing codes */}
                {!allCodes || allCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                      No codes yet - add one below
                    </TableCell>
                  </TableRow>
                ) : (
                  allCodes.map((codeEntry: { _id: string; code: string; used: boolean }) => (
                    <TableRow key={codeEntry._id} className="h-8">
                      <TableCell className=" h-8 p-0 pl-4">
                        {codeEntry.code}
                      </TableCell>
                      <TableCell className=" h-8 p-0">
                        {codeEntry.used ? "Used" : "Available"}
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {/* Always visible add form row at bottom */}
                <CreateCodeForm />
              </TableBody>
            </Table>
        </CardContent>
      </Card>
      </div>
  );
}
