import { useState } from "react";
import { useJoinTeam, useTeams } from "@/hooks/useTeams";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

interface JoinTeamDialogProps {
  userIdentifier: string;
  trigger?: React.ReactNode;
}

export function JoinTeamDialog({ userIdentifier, trigger }: JoinTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const { data: teams } = useTeams();
  const joinTeam = useJoinTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;

    await joinTeam.mutateAsync({
      teamId: selectedTeamId,
      userIdentifier,
    });

    setOpen(false);
    setSelectedTeamId("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Join Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Team</DialogTitle>
          <DialogDescription>
            Select a team to join and start competing together
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team">Select Team</Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger id="team">
                <SelectValue placeholder="Choose a team..." />
              </SelectTrigger>
              <SelectContent>
                {teams?.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} ({team.member_count || 0} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedTeamId || joinTeam.isPending}>
              {joinTeam.isPending ? "Joining..." : "Join Team"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
