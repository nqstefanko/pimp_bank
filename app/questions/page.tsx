"use client";

import { useEffect, useMemo, useState } from "react";
import { SCHEMA } from "@/lib/schema";

type RotationKey = keyof typeof SCHEMA;

type PersonRole = "RESIDENT" | "ATTENDING" | "OTHER";

type Question = {
  id: number;
  rotation: RotationKey;
  service: string;
  subspecialty: string | null;
  question: string;
  answer: string;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  askedById: number | null;
  askedBy: {
    id: number;
    name: string;
    role: PersonRole;
  } | null;
};

export default function QuestionsPage() {
  const rotationTabs = Object.keys(SCHEMA) as RotationKey[];

  const [activeTab, setActiveTab] = useState<RotationKey>("Surgery");
  const [questionsByTab, setQuestionsByTab] = useState<Record<RotationKey, Question[]>>({
    Surgery: [],
    Pediatrics: [],
    Neurology: []
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState("");
  const [newSubspecialty, setNewSubspecialty] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newAskedByName, setNewAskedByName] = useState("");
  const [newAskedByRole, setNewAskedByRole] = useState<PersonRole | "">("");
  const [isSaving, setIsSaving] = useState(false);

  const [sortBy, setSortBy] = useState("most-asked");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [askedByFilter, setAskedByFilter] = useState("all");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editService, setEditService] = useState("");
  const [editSubspecialty, setEditSubspecialty] = useState("");
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editAskedByName, setEditAskedByName] = useState("");
  const [editAskedByRole, setEditAskedByRole] = useState<PersonRole | "">("");
  const [isEditingSave, setIsEditingSave] = useState(false);

  const [editErrors, setEditErrors] = useState({
    question: false,
    answer: false,
  });

  const serviceOptions = useMemo(() => {
    return SCHEMA[activeTab]?.services ?? [];
  }, [activeTab]);

  const askedByOptions = useMemo(() => {
    const names = new Set<string>();
  
    questionsByTab[activeTab].forEach((q) => {
      if (q.askedBy?.name) {
        names.add(q.askedBy.name);
      }
    });
  
    return Array.from(names).sort();
  }, [questionsByTab, activeTab]);


  const addSubspecialtyOptions = useMemo(() => {
    if (newService !== "Other") return [];
    return SCHEMA[activeTab]?.subspecialty ?? [];
  }, [activeTab, newService]);

  const editSubspecialtyOptions = useMemo(() => {
    if (editService !== "Other") return [];
    return SCHEMA[activeTab].subspecialty;
  }, [activeTab, editService]);

  const sortedQuestions = useMemo(() => {
    const currentQuestions = questionsByTab[activeTab].filter((q) => {
      const serviceMatch =
        serviceFilter === "all" || q.service === serviceFilter;
  
      const askedByMatch =
        askedByFilter === "all" || q.askedBy?.name === askedByFilter;
  
      return serviceMatch && askedByMatch;
    });
  
    switch (sortBy) {
      case "most-asked":
        return [...currentQuestions].sort((a, b) => b.voteCount - a.voteCount);
  
      case "least-asked":
        return [...currentQuestions].sort((a, b) => a.voteCount - b.voteCount);
  
      case "newest":
        return [...currentQuestions].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
  
      case "oldest":
        return [...currentQuestions].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
  
      case "service-asc":
        return [...currentQuestions].sort((a, b) =>
          a.service.localeCompare(b.service)
        );
  
      case "service-desc":
        return [...currentQuestions].sort((a, b) =>
          b.service.localeCompare(a.service)
        );
  
      default:
        return currentQuestions;
    }
  }, [questionsByTab, activeTab, serviceFilter, askedByFilter, sortBy]);

  function handleStartEdit(q: Question) {
    setEditingId(q.id);
    setEditService(q.service);
    setEditSubspecialty(q.subspecialty ?? "");
    setEditQuestion(q.question);
    setEditAnswer(q.answer);
    setEditAskedByName(q.askedBy?.name ?? "");
    setEditAskedByRole(q.askedBy?.role ?? "");
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditService("");
    setEditSubspecialty("");
    setEditQuestion("");
    setEditAnswer("");
    setEditErrors({ question: false, answer: false });
    setEditAskedByName("");
    setEditAskedByRole("");
  }

  useEffect(() => {
    async function fetchQuestions() {
      const res = await fetch("/api/questions");
      const data: Question[] = await res.json();

      const grouped = rotationTabs.reduce((acc, rotation) => {
        acc[rotation] = [];
        return acc;
      }, {} as Record<RotationKey, Question[]>);

      data.forEach((q) => {
        if (grouped[q.rotation]) {
          grouped[q.rotation].push(q);
        }
      });

      setQuestionsByTab(grouped);
    }

    fetchQuestions();
  }, []);

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Are you sure you want to delete this question?");
    if (!confirmed) return;
  
    const res = await fetch(`/api/questions/${id}`, {
      method: "DELETE",
    });
  
    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to delete:", res.status, text);
      return;
    }
  
    setQuestionsByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((q) => q.id !== id),
    }));
  }

  async function handleSaveEdit() {
    const questionEmpty = !editQuestion.trim();
    const answerEmpty = !editAnswer.trim();
    const askedByNameEmpty = !editAskedByName.trim();
    const askedByRoleEmpty = !editAskedByRole;
    
    if (questionEmpty || answerEmpty || askedByNameEmpty || askedByRoleEmpty) {
      setEditErrors({
        question: questionEmpty,
        answer: answerEmpty,
      });
      return;
    }

    setEditErrors({ question: false, answer: false });
    setIsEditingSave(true);

    try {
      const res = await fetch(`/api/questions/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: editService,
          subspecialty: editSubspecialty || null,
          question: editQuestion.trim(),
          answer: editAnswer.trim(),
          askedByName: editAskedByName.trim(),
          askedByRole: editAskedByRole,
        }),
      });

      if (!res.ok) {
        console.error("Failed to update question");
        return;
      }

      const updatedQuestion: Question = await res.json();

      setQuestionsByTab((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].map((q) =>
          q.id === editingId ? updatedQuestion : q
        ),
      }));

      handleCancelEdit();
    } finally {
      setIsEditingSave(false);
    }
  }

  async function handleUpvote(id: number) {
    const res = await fetch(`/api/questions/${id}/upvote`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error("Failed to upvote");
      return;
    }

    const updatedQuestion: Question = await res.json();

    setQuestionsByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((q) =>
        q.id === id ? updatedQuestion : q
      ),
    }));
  }

  async function handleSaveQuestion() {
    if (
      !newService ||
      !newQuestion.trim() ||
      !newAnswer.trim() ||
      !newAskedByName.trim() ||
      !newAskedByRole
    ) {
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rotation: activeTab,
          service: newService,
          subspecialty: newSubspecialty || null,
          question: newQuestion.trim(),
          answer: newAnswer.trim(),
          askedByName: newAskedByName.trim(),
          askedByRole: newAskedByRole,
        }),
      });

      if (!res.ok) {
        console.error("Failed to save question");
        return;
      }

      const createdQuestion: Question = await res.json();

      setQuestionsByTab((prev) => ({
        ...prev,
        [activeTab]: [...prev[activeTab], createdQuestion],
      }));

      setNewService("");
      setNewSubspecialty("");
      setNewQuestion("");
      setNewAnswer("");
      setNewAskedByName("");
      setNewAskedByRole("");
      setShowAddForm(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-screen-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Pimp Bank</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Commonly asked questions for rotations
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {rotationTabs.map((tab) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setServiceFilter("all");
                setAskedByFilter("all");
                setShowAddForm(false);
                setNewService("");
                setNewSubspecialty("");
                setNewQuestion("");
                setNewAnswer("");
                setNewAskedByName("");
                setNewAskedByRole("");
              }}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-white text-black shadow-sm"
                  : "border border-zinc-700 text-white hover:bg-zinc-900"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Showing {activeTab}
          {serviceFilter !== "all" ? ` • ${serviceFilter}` : ""} questions
        </p>

        <div className="flex gap-2">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-white outline-none hover:bg-zinc-900"
          >
            <option value="all">All Services</option>
            {serviceOptions.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>

          <select
            value={askedByFilter}
            onChange={(e) => setAskedByFilter(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-white outline-none hover:bg-zinc-900"
          >
            <option value="all">All Askers</option>
            {askedByOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-white outline-none hover:bg-zinc-900"
          >
            <option value="most-asked">Most Asked</option>
            <option value="least-asked">Least Asked</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="service-asc">Service A–Z</option>
            <option value="service-desc">Service Z–A</option>
          </select>

          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
          >
            Add
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Add Question</h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewService("");
                setNewSubspecialty("");
                setNewQuestion("");
                setNewAnswer("");
                setNewAskedByName("");
                setNewAskedByRole("");
              }}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              X
            </button>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Service
              </label>
              <select
                value={newService}
                onChange={(e) => {
                  setNewService(e.target.value);
                  setNewSubspecialty("");
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
              >
                <option value="">Select service</option>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Subspecialty
              </label>
              <select
                value={newSubspecialty}
                onChange={(e) => setNewSubspecialty(e.target.value)}
                disabled={newService !== "Other"}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {newService === "Other" ? "Select subspecialty" : "None"}
                </option>
                {addSubspecialtyOptions.map((subspec) => (
                  <option key={subspec} value={subspec}>
                    {subspec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Asked By Name
              </label>
              <input
                value={newAskedByName}
                onChange={(e) => setNewAskedByName(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                placeholder="Smith (Type in last name only)"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Role
              </label>
              <select
                value={newAskedByRole}
                onChange={(e) => setNewAskedByRole(e.target.value as PersonRole | "")}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
              >
                <option value="">Select role</option>
                <option value="RESIDENT">Resident</option>
                <option value="ATTENDING">Attending</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Question
              </label>
              <input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                placeholder="What are the layers of the abdominal wall?"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Answer
              </label>
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                placeholder="Skin, Camper fascia..."
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveQuestion}
                disabled={isSaving}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-lg">
      <div className="w-full overflow-x-auto">
        <table className="min-w-[1200px] table-fixed text-left">
            <colgroup>
              <col className="w-[6%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[14%]" />
              <col className="w-[26%]" />
              <col className="w-[15%]" />
              <col className="w-[5%]" />
              <col className="w-[12%]" />
            </colgroup>

            <thead className="bg-zinc-900">
              <tr className="border-b border-zinc-800">
                <th className="px-2 py-2 text-sm font-semibold text-zinc-200">Created</th>
                <th className="px-2 py-2 text-sm font-semibold text-zinc-200">Service</th>
                <th className="px-2 py-2 text-sm font-semibold text-zinc-200">Subspec</th>
                <th className="px-2 py-2 text-sm font-semibold text-zinc-200">Asked By</th>
                <th className="px-2 py-2 text-sm font-semibold text-zinc-200">Question</th>
                <th className="px-2 py-2 text-sm font-semibold text-zinc-200">Answer</th>
                <th className="px-2 py-2 text-sm font-semibold text-zinc-200">Votes</th>
                <th className="px-2 py-2 text-sm font-semibold text-zinc-200">Action</th>
              </tr>
            </thead>

            <tbody>
              {sortedQuestions.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-zinc-800 align-top last:border-b-0"
                >
                  {/* Created at */}
                  <td className="px-2 py-2 text-sm text-zinc-300">
                    {(() => {
                      const d = new Date(q.createdAt);
                      const today = new Date();

                      const isToday =
                        d.getDate() === today.getDate() &&
                        d.getMonth() === today.getMonth() &&
                        d.getFullYear() === today.getFullYear();

                      return isToday
                        ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                        : d.toLocaleDateString("en-US", {
                            month: "numeric",
                            day: "numeric",
                            year: "2-digit",
                          });
                    })()}
                  </td>
                  
                  {/* Service */}
                  <td className="px-2 py-2 text-sm text-zinc-100">
                    {editingId === q.id ? (
                      <select
                        value={editService}
                        onChange={(e) => {
                          setEditService(e.target.value);
                          setEditSubspecialty("");
                        }}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white outline-none"
                      >
                        <option value="">Select service</option>
                        {serviceOptions.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="break-words leading-6">{q.service}</div>
                    )}
                  </td>

                  {/* SubSpec */}
                  <td className="px-2 py-2 text-sm text-zinc-100">
                  {editingId === q.id ? (
                    <select
                      value={editSubspecialty}
                      onChange={(e) => setEditSubspecialty(e.target.value)}
                      disabled={editService !== "Other"}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {editService === "Other" ? "Select subspecialty" : "None"}
                      </option>

                      {editSubspecialtyOptions.map((subspec) => (
                        <option key={subspec} value={subspec}>
                          {subspec}
                        </option>
                      ))}
                    </select>
                  ) : (
                      <div className="break-words leading-6">
                      {q.subspecialty ?? (q.rotation === "Surgery" ? "General Surgery" : "—")}
                      </div>
                    )}

                  </td>
                    {/* Asked by */}
                    <td className="px-2 py-2 text-sm text-zinc-100">
                    {editingId === q.id ? (
                      <div className="space-y-2">
                        <input
                          value={editAskedByName}
                          onChange={(e) => setEditAskedByName(e.target.value)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white outline-none"
                          placeholder="Smith"
                        />
                        <select
                          value={editAskedByRole}
                          onChange={(e) => setEditAskedByRole(e.target.value as PersonRole | "")}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white outline-none"
                        >
                          <option value="">Select role</option>
                          <option value="RESIDENT">Resident</option>
                          <option value="ATTENDING">Attending</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    ) : (
                      <div className="break-words leading-5">
                        {q.askedBy ? (
                          <>
                            <div>{q.askedBy.role === "ATTENDING" || q.askedBy.role === "RESIDENT" ? `Dr. ${q.askedBy.name}` : q.askedBy.name}</div>
                            <div className="text-xs text-zinc-400">
                              {q.askedBy.role.charAt(0) + q.askedBy.role.slice(1).toLowerCase()}
                            </div>
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    )}
                  </td>
                  
                  {/* Question */}
                  <td className="px-2 py-2 text-sm text-zinc-100">
                    {editingId === q.id ? (
                      <div>
                        <textarea
                          value={editQuestion}
                          onChange={(e) => {
                            setEditQuestion(e.target.value);
                            if (editErrors.question) {
                              setEditErrors((prev) => ({ ...prev, question: false }));
                            }
                          }}
                          rows={3}
                          className={`w-full rounded-lg border px-2 py-1 text-sm outline-none ${
                            editErrors.question
                              ? "border-red-500 bg-red-900/20"
                              : "border-zinc-700 bg-zinc-900 text-white"
                          }`}
                        />
                        {editErrors.question && (
                          <p className="mt-1 text-xs text-red-400">Required</p>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-normal break-words break-words leading-5">
                        {q.question}
                      </div>
                    )}
                  </td>

                  {/* Answer */}
                  <td className="px-2 py-2 text-sm text-zinc-300">
                    {editingId === q.id ? (
                      <textarea
                        value={editAnswer}
                        onChange={(e) => {
                          setEditAnswer(e.target.value);
                          if (editErrors.answer) {
                            setEditErrors((prev) => ({ ...prev, answer: false }));
                          }
                        }}
                        rows={4}
                        className={`w-full rounded-lg border px-2 py-1 text-sm outline-none ${
                          editErrors.answer
                            ? "border-red-500 bg-red-900/20"
                            : "border-zinc-700 bg-zinc-900 text-white"
                        }`}
                      />
                    ) : (
                      <div className="relative group min-h-[60px]">
                        <div className="whitespace-normal break-words break-words leading-5 text-center blur-sm transition duration-200 group-hover:blur-none">
                          {q.answer}
                        </div>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-zinc-500 group-hover:hidden">
                          hover to reveal
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Votes */}
                  <td className="px-2 py-2 text-sm font-semibold text-white">
                    {q.voteCount}
                  </td>

                  {/* Action */}
                  <td className="px-2 py-2">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleUpvote(q.id)}
                        className="w-full rounded-lg bg-white px-3 py-1 text-sm font-medium text-black hover:bg-zinc-200"
                      >
                        +1
                      </button>

                      {editingId === q.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={isEditingSave}
                            className="min-w-0 flex-1 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isEditingSave ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="min-w-0 flex-1 whitespace-nowrap rounded-lg border border-zinc-700 px-2 py-1 text-sm text-zinc-200"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStartEdit(q)}
                            className="min-w-0 flex-1 whitespace-nowrap rounded-lg border border-zinc-700 px-2 py-1 text-sm text-zinc-200"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(q.id)}
                            className="min-w-0 flex-1 whitespace-nowrap rounded-lg border border-red-700 px-2 py-1 text-sm text-red-400 hover:bg-red-900/20"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

// npm run dev
// npm prisma studi

// Surg: ACS, CRS, Trauma, 



// 3. Basic validation
// Prevent empty fields, trim whitespace, maybe minimum lengths.

// 4. Loading/error states
// Tiny polish:

// saving...
// failed to save
// failed to load
// no questions yet

// 5. Filter by subspecialty
// You already sort. Filtering is the next most useful thing.

// 6. Decide vote philosophy
// For now it works, but without auth anyone can spam votes. That is okay for MVP, but decide whether you want:

// unlimited for now
// one per browser later
// one per login later

// 7. Seed more realistic data
// A few more surgery and family med questions so the app feels real.

// 8. Clean backend shape
// At some point:

// GET questions
// POST question
// PATCH question
// POST upvote
// DELETE question

// That gives you your full MVP backend.

// 9. Light moderation/admin plan
// Even before auth, think:

// can anyone edit anything?
// can anyone delete anything?
// is that okay for now?

// 10. Deploy
// Once edit/delete work and validation is decent, it is probably ready for a first private test.

// My honest take: the most important next feature is Edit, then Delete, then Subspecialty filter. After that, you basically have a legit MVP.




// Physician (Resident) specify which one
 
// 