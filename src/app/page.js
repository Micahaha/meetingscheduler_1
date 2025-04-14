"use client";

import { useState } from "react";
import { Dexie } from "dexie";
import { useLiveQuery } from "dexie-react-hooks"; 
import { format } from "date-fns";


// db initialization
export const db = new Dexie("MeetingSchedulerDB");
db.version(1).stores({
  meetings: "++id, host, participant, date, time, description",
  hosts: "++id, name",
  participant: "++id, name, email"
});



export default function MeetingScheduler() {
  const [hostName, setHostName] = useState("");
  const [form, setForm] = useState({ host: "", date: "", time: "", description: "" });
  const [participant, setParticipant] = useState({ name: "", email: "" });
  const hosts = useLiveQuery(() => db.hosts.toArray());
  const meetings = useLiveQuery(() => db.meetings.toArray());
  const participants = useLiveQuery(() => db.participant.toArray());


  const addHost = () => {
    if (hostName && !hosts.includes(hostName)) {
      db.hosts.add({ name: hostName });
    }
  };

  const addParticipant = () => { 
     if (participant.name && participant.email) {
      db.participant.add({ name: participant.name, email: participant.email });
    }

  }

  const scheduleMeeting = () => {
    if (form.host && form.date && form.time && form.description) {
      db.meetings.add({
        host: form.host,
        date: form.date,
        time: form.time,
        description: form.description,
      });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl text-center font-bold mb-4">Meeting Scheduler</h1>

      <div className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Add Host</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="border p-2 rounded w-full"
            placeholder="Host Name"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={addHost}
          >
            Add
          </button>
        </div>
        <h3 className="font-medium">Existing Hosts:</h3>
        <ul className="list-disc pl-5">
          {hosts?.map((host) => (
            <li key={host.id} className="mb-1">
              {host.name}
              <button className="text-xl ml-2 text-red-500" onClick={() => db.hosts.delete(host.id)}>🗑</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Schedule a Meeting</h2>
        <div className="space-y-2">
          <select
            className="w-full border rounded p-2"
            value={form.host}
            onChange={(e) => setForm({...form, host: e.target.value })}
          >
            <option value="">Select Host</option>
            {hosts?.map((host) => (
              <option key={host.id} value={host.name}>
                {host.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="border p-2 rounded w-full"
            value={form.date}
            onChange={(e) => setForm({...form, date: e.target.value })}
          />
          <input
            type="time"
            className="border p-2 rounded w-full"
            value={form.time}
            onChange={(e) => setForm({...form, time: e.target.value })}
          />
          <input
            type="text"
            placeholder="Description"
            className="border p-2 rounded w-full"
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value })}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={scheduleMeeting}
          >
            Schedule
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-2">Scheduled Meetings</h2>
        {meetings?.length === 0 ? (
          <p>No meetings scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {meetings?.map((meetings) => (
              <li key={meetings.id} className="border p-2 rounded">
                <p><strong>Host:</strong> {meetings.host} | <button className="text-xl ml-2 text-red-500" onClick={() => db.meetings.delete(meetings.id)}>🗑</button>                </p>
                <p><strong>Date:</strong> {format(new Date(`${meetings.date}T${meetings.time}`), "PPPP")}</p>
                <p><strong>Time:</strong> {meetings.time}</p>
                <p><strong>Description:</strong> {meetings.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
