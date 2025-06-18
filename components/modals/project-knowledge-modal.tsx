"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  BookOpen, 
  FileText, 
  Link, 
  Code, 
  Pin, 
  PinOff,
  Edit,
  Trash2,
  Tag,
  Calendar,
  User,
  ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  content_type: "markdown" | "text" | "code" | "link";
  category?: string;
  tags: string[];
  priority: number;
  file_path?: string;
  source_url?: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface ProjectKnowledgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

const KNOWLEDGE_CATEGORIES = [
  "Documentation",
  "Setup",
  "API Reference",
  "Troubleshooting",
  "Best Practices",
  "Code Examples",
  "Resources",
  "Notes"
];

const CONTENT_TYPE_ICONS = {
  markdown: <FileText className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  link: <Link className="h-4 w-4" />
};

export function ProjectKnowledgeModal({ open, onOpenChange, project }: ProjectKnowledgeModalProps) {
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    content_type: "markdown" as "markdown" | "text" | "code" | "link",
    category: "",
    tags: "",
    priority: 0,
    source_url: "",
    is_pinned: false
  });

    const loadKnowledgeEntries = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/projects/${project.id}/knowledge`);
        if (!response.ok) {
          throw new Error("Failed to load knowledge entries");
        }
        
        const { entries } = await response.json();
        setKnowledgeEntries(entries || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load knowledge");
        // For demo purposes, set some sample data
        setKnowledgeEntries([
          {
            id: "1",
            title: "Project Setup Instructions",
            content: "# Setup\n\n1. Clone the repository\n2. Install dependencies with `npm install`\n3. Start development server with `npm run dev`",
            content_type: "markdown",
            category: "Setup",
            tags: ["setup", "installation"],
            priority: 10,
            is_pinned: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "2",
            title: "API Endpoints",
            content: "Key API endpoints:\n- GET /api/users\n- POST /api/users\n- PUT /api/users/:id\n- DELETE /api/users/:id",
            content_type: "text",
            category: "API Reference",
            tags: ["api", "endpoints"],
            priority: 8,
            is_pinned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "3",
            title: "Useful Resources",
            content: "https://nextjs.org/docs",
            content_type: "link",
            category: "Resources",
            tags: ["documentation", "nextjs"],
            priority: 5,
            source_url: "https://nextjs.org/docs",
            is_pinned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }, [project.id]);
  
    useEffect(() => {
      if (open && project) {
        loadKnowledgeEntries();
      }
    }, [loadKnowledgeEntries, open, project]);
  
    const handleSaveEntry = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      const entryData = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        project_id: project.id
      };

      const url = editingEntry 
        ? `/api/projects/${project.id}/knowledge/${editingEntry.id}`
        : `/api/projects/${project.id}/knowledge`;
      
      const method = editingEntry ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData)
      });

      if (!response.ok) {
        throw new Error("Failed to save knowledge entry");
      }

      // Reload entries
      await loadKnowledgeEntries();
      
      // Reset form
      setFormData({
        title: "",
        content: "",
        content_type: "markdown",
        category: "",
        tags: "",
        priority: 0,
        source_url: "",
        is_pinned: false
      });
      setShowAddForm(false);
      setEditingEntry(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
    }
  };

  const handleEditEntry = (entry: KnowledgeEntry) => {
    setFormData({
      title: entry.title,
      content: entry.content,
      content_type: entry.content_type,
      category: entry.category || "",
      tags: entry.tags.join(", "),
      priority: entry.priority,
      source_url: entry.source_url || "",
      is_pinned: entry.is_pinned
    });
    setEditingEntry(entry);
    setShowAddForm(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this knowledge entry?")) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/knowledge/${entryId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      await loadKnowledgeEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  };

  const handleTogglePin = async (entry: KnowledgeEntry) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/knowledge/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !entry.is_pinned })
      });

      if (!response.ok) {
        throw new Error("Failed to update entry");
      }

      await loadKnowledgeEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry");
    }
  };

  // Filter entries based on search and category
  const filteredEntries = React.useMemo(() => {
    let filtered = knowledgeEntries;

    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }

    // Sort by priority (pinned first, then by priority, then by updated date)
    return filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [knowledgeEntries, searchQuery, selectedCategory]);

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingEntry(null);
    setFormData({
      title: "",
      content: "",
      content_type: "markdown",
      category: "",
      tags: "",
      priority: 0,
      source_url: "",
      is_pinned: false
    });
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Knowledge Base - {project.name}
          </DialogTitle>
          <DialogDescription>
            Store and organize important information, documentation, and resources for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="browse" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse Knowledge</TabsTrigger>
              <TabsTrigger value="add">Add Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                {/* Search and Filters */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search knowledge..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {KNOWLEDGE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Error Display */}
                {error && (
                  <Alert className="border-red-200 bg-red-50 text-red-800">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}

                {/* Knowledge Entries */}
                <div className="flex-1 overflow-y-auto space-y-4">
                  {!isLoading && filteredEntries.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No knowledge entries</h3>
                      <p className="text-muted-foreground">
                        {knowledgeEntries.length === 0
                          ? "Start building your project knowledge base by adding your first entry."
                          : "No entries match your search criteria."
                        }
                      </p>
                    </div>
                  )}

                  {filteredEntries.map((entry) => (
                    <Card key={entry.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            {entry.is_pinned && <Pin className="h-4 w-4 text-blue-500 mt-1" />}
                            {CONTENT_TYPE_ICONS[entry.content_type]}
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base">{entry.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                {entry.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {entry.category}
                                  </Badge>
                                )}
                                {entry.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTogglePin(entry)}>
                                {entry.is_pinned ? (
                                  <>
                                    <PinOff className="h-4 w-4 mr-2" />
                                    Unpin
                                  </>
                                ) : (
                                  <>
                                    <Pin className="h-4 w-4 mr-2" />
                                    Pin
                                  </>
                                )}
                              </DropdownMenuItem>
                              {entry.source_url && (
                                <DropdownMenuItem asChild>
                                  <a href={entry.source_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Source
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          {entry.content_type === "link" ? (
                            <a 
                              href={entry.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {entry.content}
                            </a>
                          ) : (
                            <div className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md max-h-32 overflow-y-auto">
                              {entry.content}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(entry.updated_at).toLocaleDateString()}
                            </div>
                            {entry.priority > 0 && (
                              <div className="flex items-center gap-1">
                                <span>Priority: {entry.priority}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter title..."
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content_type">Content Type</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="text">Plain Text</SelectItem>
                        <SelectItem value="code">Code Snippet</SelectItem>
                        <SelectItem value="link">Link/URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder={
                      formData.content_type === "link" 
                        ? "https://example.com"
                        : "Enter your content..."
                    }
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {KNOWLEDGE_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority (0-10)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="0"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      placeholder="tag1, tag2, tag3"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                </div>

                {formData.content_type === "link" && (
                  <div className="space-y-2">
                    <Label htmlFor="source_url">Source URL (optional)</Label>
                    <Input
                      id="source_url"
                      placeholder="https://source.com"
                      value={formData.source_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                    />
                  </div>
                )}

                {error && (
                  <Alert className="border-red-200 bg-red-50 text-red-800">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_pinned"
                      checked={formData.is_pinned}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="is_pinned">Pin this entry</Label>
                  </div>
                  
                  <div className="flex gap-2">
                    {editingEntry && (
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    )}
                    <Button onClick={handleSaveEntry}>
                      {editingEntry ? "Update Entry" : "Add Entry"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
