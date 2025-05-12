"use client";

import { useState } from "react";
import { Dexie } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

export const db = new Dexie("MeetingSchedulerDB");
db.version(1).stores({
  hosts: "++id, name",
  meetings: "++id, name, hostId, location, date",
  participants: "++id, name",
  responses: "++id, meetingId, participantId, response"
});

export default function MeetingScheduler() {
  const [hostName, setHostName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [meetingForm, setMeetingForm] = useState({ name: "", hostId: "", location: "", date: "" });
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [responseText, setResponseText] = useState("");
  const [selectedHost, setSelectedHost] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const hosts = useLiveQuery(() => db.hosts.toArray());
  const meetings = useLiveQuery(() => db.meetings.toArray());
  const participants = useLiveQuery(() => db.participants.toArray());
  const responses = useLiveQuery(() => db.responses.toArray());

  const addHost = () => {
    if (hostName) {
      db.hosts.add({ name: hostName });
      setHostName("");
    }
  };

  const addParticipant = () => {
    if (participantName) {
      db.participants.add({ name: participantName });
      setParticipantName("");
    }
  };

  const addParticipant = () => { 
     if (participant.name && participant.email) {
      db.participants.add({ name: participant.name, email: participant.email });
    }

  }

  const scheduleMeeting = () => {
    if (meetingForm.name && meetingForm.hostId && meetingForm.location && meetingForm.date) {
      db.meetings.add(meetingForm);
      setMeetingForm({ name: "", hostId: "", location: "", date: "" });
    }
  };

  const respondToMeeting = () => {
    if (selectedMeetingId && selectedParticipantId && responseText) {
      db.responses.add({
        meetingId: Number(selectedMeetingId),
        participantId: Number(selectedParticipantId),
        response: responseText,
      });
      setResponseText("");
    }
  };

  const getResponsesForMeeting = (meetingId) => {
    return responses?.filter(r => r.meetingId === meetingId).map(r => {
      const participant = participants?.find(p => p.id === r.participantId);
      return { name: participant?.name || "Unknown", response: r.response };
    }) || [];
  };


  async function deleteHostChildren(id) {
    await db.transaction("rw", db.hosts, db.meetings, db.participant, async () => {
      const meetingsToDelete = await db.meetings.where("hostId").equals(id).toArray();
      for (const meeting of meetingsToDelete) {
        await db.meetings.delete(meeting.id);
      }
    
      const participantsToDelete = await db.participant
        .where("meetingId")
        .equals(id)
        .toArray();
    
      for (const p of participantsToDelete) {
        await db.participants.delete(p.id);
      }
    
      await db.hosts.delete(id);
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">Meeting Scheduler</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Add Host</h2>
          <div className="flex gap-2">
            <Input placeholder="Full Name" value={hostName} onChange={(e) => setHostName(e.target.value)} />
            <Button onClick={addHost}>Add</Button>
          </div>
          <div className="space-y-2">
            {hosts?.map((host) => (
              <div key={host.id} className="flex items-center justify-between">
                <span>{host.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Add Participant</h2>
          <div className="flex gap-2">
            <Input placeholder="Full Name" value={participantName} onChange={(e) => setParticipantName(e.target.value)} />
            <Button onClick={addParticipant}>Add</Button>
          </div>
          <div className="space-y-2">
            {participants?.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Schedule Meeting</h2>
          <Input placeholder="Meeting Name" value={meetingForm.name} onChange={(e) => setMeetingForm({ ...meetingForm, name: e.target.value })} />
          <div className="flex gap-2">
            {selectedHost ? (
              <span>{hosts?.find(h => h.id === selectedHost)?.name}</span>
            ) : (
              <Select value={meetingForm.hostId} onValueChange={(v) => setMeetingForm({ ...meetingForm, hostId: v })}>
                <SelectTrigger>Select Host</SelectTrigger>
                <SelectContent>
                  {hosts?.map((host) => (
                    <SelectItem key={host.id} value={String(host.id)}>{host.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Input placeholder="Location" value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} />
          <Input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} />
          <Button onClick={scheduleMeeting}>Schedule</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Respond to Meeting</h2>
          <div className="flex gap-2">
            {selectedMeeting ? (
              <span>{meetings?.find(m => m.id === selectedMeeting)?.name}</span>
            ) : (
              <Select value={selectedMeetingId} onValueChange={setSelectedMeetingId}>
                <SelectTrigger>Select Meeting</SelectTrigger>
                <SelectContent>
                  {meetings?.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedParticipant ? (
              <span>{participants?.find(p => p.id === selectedParticipant)?.name}</span>
            ) : (
              <Select value={selectedParticipantId} onValueChange={setSelectedParticipantId}>
                <SelectTrigger>Select Participant</SelectTrigger>
                <SelectContent>
                  {participants?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Input placeholder="Your response" value={responseText} onChange={(e) => setResponseText(e.target.value)} />
          <Button onClick={respondToMeeting}>Submit Response</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Scheduled Meetings</h2>
          {meetings?.map((meeting) => {
            const host = hosts?.find((h) => h.id === Number(meeting.hostId));
            const responsesForMeeting = getResponsesForMeeting(meeting.id);
            return (
              <div key={meeting.id} className="border rounded p-4 space-y-2">
                <p><strong>Name:</strong> {meeting.name}</p>
                <p><strong>Host:</strong> {host?.name || "Unknown"}</p>
                <p><strong>Location:</strong> {meeting.location}</p>
                <p><strong>Date:</strong> {format(new Date(meeting.date), "PPP")}</p>
                {responsesForMeeting.length > 0 && (
                  <div className="mt-2">
                    <strong>Responses:</strong>
                    <ul className="list-disc pl-5">
                      {responsesForMeeting.map((r, i) => (
                        <li key={i}><strong>{r.name}:</strong> {r.response}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
