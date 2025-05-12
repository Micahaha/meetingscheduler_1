"use client";

import { useState } from "react";
import { Dexie } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const db = new Dexie("MeetingSchedulerDB");
db.version(2).stores({
  hosts: "++id, name, email",
  meetings: "++id, name, hostId, location, date",
  participants: "++id, name, email",
  responses: "++id, meetingId, participantId, response"
});

export default function MeetingScheduler() {
  const [hostName, setHostName] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [meetingForm, setMeetingForm] = useState({ name: "", hostId: "", location: "", date: "" });
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [responseText, setResponseText] = useState("Accepted");

  const hosts = useLiveQuery(() => db.hosts.toArray());
  const meetings = useLiveQuery(() => db.meetings.toArray());
  const participants = useLiveQuery(() => db.participants.toArray());
  const responses = useLiveQuery(() => db.responses.toArray());

  const addHost = () => {
    if (hostName && hostEmail) {
      db.hosts.add({ name: hostName, email: hostEmail });
      setHostName("");
      setHostEmail("");
    }
  };

  const deleteMeeting = (meetingId) => {
    db.meetings.delete(Number(meetingId));
    db.responses.where({ meetingId: Number(meetingId) }).delete();
  };

  const deleteParticipant = (participantId) => {
    db.participants.delete(Number(participantId));
    db.responses.where({ participantId: Number(participantId) }).delete();
  };

  const deleteHost = async (hostId) => {
  await db.hosts.delete(Number(hostId));

  // Get all meetings by this host
  const meetingsToDelete = await db.meetings.where({ hostId: Number(hostId) }).toArray();

  // Delete each meeting and its responses
  for (const meeting of meetingsToDelete) {
    await db.meetings.delete(meeting.id);
    await db.responses.where({ meetingId: meeting.id }).delete();
  }
};

  const addParticipant = () => {
    if (participantName && participantEmail) {
      db.participants.add({ name: participantName, email: participantEmail });
      setParticipantName("");
      setParticipantEmail("");
    }
  };

  const scheduleMeeting = () => {
    if (meetingForm.name && meetingForm.hostId && meetingForm.location && meetingForm.date) {
      db.meetings.add(meetingForm);
      setMeetingForm({ name: "", hostId: "", location: "", date: "" });
    }
  };

  const respondToMeeting = () => {
    if (selectedMeetingId && selectedParticipantId && responseText) {
      const existingResponse = responses?.find(
        (r) =>
          r.meetingId === Number(selectedMeetingId) &&
          r.participantId === Number(selectedParticipantId)
      );

      if (existingResponse) {
        db.responses.update(existingResponse.id, { response: responseText });
      } else {
        db.responses.add({
          meetingId: Number(selectedMeetingId),
          participantId: Number(selectedParticipantId),
          response: responseText,
        });
      }
    }
  };

  const getResponsesForMeeting = (meetingId) => {
    return responses?.filter(r => r.meetingId === meetingId).map(r => {
      const participant = participants?.find(p => p.id === r.participantId);
      return { id: r.participantId, name: participant?.name || "Unknown", response: r.response };
    }) || [];
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">Meeting Scheduler</h1>

      {/* Add Host */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Add Host</h2>
          <div className="flex gap-2">
            <Input placeholder="Full Name" value={hostName} onChange={(e) => setHostName(e.target.value)} />
            <Input placeholder="Email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} />
            <Button onClick={addHost}>Add</Button>
          </div>
          <div className="space-y-2">
            {hosts?.map((host) => (
              <div key={host.id} className="flex items-center justify-between">
                <span>{host.name} ({host.email})</span>
                <Button variant="destructive" onClick={() => deleteHost(host.id)}>Delete</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Participant */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Add Participant</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Full Name"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
            />
            <Input
              placeholder="Email"
              value={participantEmail}
              onChange={(e) => setParticipantEmail(e.target.value)}
            />
            <Button onClick={addParticipant}>Add</Button>
          </div>
          <div className="space-y-2">
            {participants?.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span>{p.name} ({p.email})</span>
                <Button variant="destructive" onClick={() => deleteParticipant(p.id)}>Delete</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Meeting */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Schedule Meeting</h2>
          <Input placeholder="Meeting Name" value={meetingForm.name} onChange={(e) => setMeetingForm({ ...meetingForm, name: e.target.value })} />
          <div className="flex gap-2">
            <Select value={meetingForm.hostId} onValueChange={(v) => setMeetingForm({ ...meetingForm, hostId: v })}>
              <SelectTrigger>
                {meetingForm.hostId ? hosts?.find(h => h.id === Number(meetingForm.hostId))?.name : "Select Host"}
              </SelectTrigger>
              <SelectContent>
                {hosts?.map((host) => (
                  <SelectItem key={host.id} value={String(host.id)}>{host.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Location" value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} />
          <Input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} />
          <Button onClick={scheduleMeeting}>Schedule</Button>
        </CardContent>
      </Card>

      {/* Respond to Meeting */}
      <Card>
  <CardContent className="p-6 space-y-4">
    <h2 className="text-xl font-semibold">Respond to Meeting</h2>
    <div className="flex gap-2">
      <Select value={selectedMeetingId} onValueChange={setSelectedMeetingId}>
        <SelectTrigger>
          {selectedMeetingId ? meetings?.find(m => m.id === Number(selectedMeetingId))?.name : "Select Meeting"}
        </SelectTrigger>
        <SelectContent>
          {meetings?.map((m) => (
            <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedParticipantId} onValueChange={setSelectedParticipantId}>
        <SelectTrigger>
          {selectedParticipantId ? participants?.find(p => p.id === Number(selectedParticipantId))?.name : "Select Participant"}
        </SelectTrigger>
        <SelectContent>
          {participants?.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <Select value={responseText} onValueChange={setResponseText}>
      <SelectTrigger>{responseText}</SelectTrigger>
      <SelectContent>
        <SelectItem value="Accepted">Accepted</SelectItem>
        <SelectItem value="Declined">Declined</SelectItem>
      </SelectContent>
    </Select>

    <Button onClick={respondToMeeting}>Submit Response</Button>
  </CardContent>
</Card>


      {/* Scheduled Meetings */}
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
                <Button variant="destructive" onClick={() => deleteMeeting(meeting.id)}>Delete Meeting</Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
