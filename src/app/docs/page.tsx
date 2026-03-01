'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Book, Video, Code, Terminal, Users, Download, Search, BookOpen, HelpCircle } from "lucide-react";

export default function DocsPage() {
  const docCategories = [
    {
      name: 'Getting Started',
      description: 'Quick start with Mission Control',
      icon: BookOpen,
      docs: 5,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'API Documentation',
      description: 'Complete API reference documentation',
      icon: Code,
      docs: 12,
      color: 'from-green-500 to-emerald-500',
    },
    {
      name: 'User Manual',
      description: 'Detailed feature usage instructions',
      icon: Book,
      docs: 8,
      color: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Developer Guide',
      description: 'System development and extension guide',
      icon: Terminal,
      docs: 6,
      color: 'from-orange-500 to-red-500',
    },
    {
      name: 'Tutorial Videos',
      description: 'Video tutorials and demos',
      icon: Video,
      docs: 3,
      color: 'from-yellow-500 to-amber-500',
    },
    {
      name: 'FAQ',
      description: 'Frequently asked questions',
      icon: HelpCircle,
      docs: 15,
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  const recentDocs = [
    {
      title: 'Mission Control Quick Start',
      description: 'How to start using Mission Control in 5 minutes',
      category: 'Getting Started',
      updated: '2026-02-21',
      views: '1,248',
    },
    {
      title: 'Complete API Reference',
      description: 'Detailed documentation and examples for all API endpoints',
      category: 'API Documentation',
      updated: '2026-02-20',
      views: '892',
    },
    {
      title: 'Automation Workflow Configuration',
      description: 'How to create and manage automation workflows',
      category: 'User Manual',
      updated: '2026-02-19',
      views: '756',
    },
    {
      title: 'System Integration Guide',
      description: 'How to integrate Mission Control into existing systems',
      category: 'Developer Guide',
      updated: '2026-02-18',
      views: '543',
    },
    {
      title: 'Troubleshooting Guide',
      description: 'Common issue diagnostics and solutions',
      category: 'FAQ',
      updated: '2026-02-17',
      views: '1,125',
    },
    {
      title: 'Performance Optimization Guide',
      description: 'How to optimize system performance',
      category: 'Developer Guide',
      updated: '2026-02-16',
      views: '432',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Documentation Center 📚</h1>
            <p className="text-muted-foreground">System documentation and usage guides</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search Docs
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>

        {/* Document categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${category.color}`}>
                    <category.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{category.docs} documents</span>
                  <Button size="sm" variant="outline">View All</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent documents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>Latest updated documents and guides</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocs.map((doc, index) => (
                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{doc.title}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {doc.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">Updated: {doc.updated}</span>
                      <span className="text-gray-500">Views: {doc.views}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">Preview</Button>
                    <Button size="sm">Read</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick start */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <BookOpen className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">Quick Start</h3>
                  <p className="text-sm text-muted-foreground">5-minute tutorial</p>
                </div>
                <Button className="w-full">Start Learning</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Code className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">API Reference</h3>
                  <p className="text-sm text-muted-foreground">Complete API documentation</p>
                </div>
                <Button className="w-full">View API</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Users className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-bold text-lg">Community Support</h3>
                  <p className="text-sm text-muted-foreground">Get help and connect</p>
                </div>
                <Button className="w-full">Join Community</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document search */}
        <Card>
          <CardHeader>
            <CardTitle>Document Search</CardTitle>
            <CardDescription>Quickly find the documents you need</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <Button>Search</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['install', 'config', 'API', 'troubleshoot', 'performance', 'security', 'integration', 'deploy'].map((tag, index) => (
                  <button
                    key={index}
                    className="px-3 py-1 text-sm border rounded-full hover:bg-gray-50"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contribution guide */}
        <Card>
          <CardHeader>
            <CardTitle>Contribute to Docs</CardTitle>
            <CardDescription>How to contribute and improve documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Report Issues</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Documentation errors or outdated content</li>
                    <li>• Missing important content</li>
                    <li>• Translation issues</li>
                    <li>• Formatting issues</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Contribute Content</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Add documentation for new features</li>
                    <li>• Write tutorials and examples</li>
                    <li>• Translate documentation</li>
                    <li>• Improve existing content</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">How to Submit</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• GitHub Pull Request</li>
                    <li>• Email submission</li>
                    <li>• Community forum</li>
                    <li>• Direct editing</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">View Contribution Guide</Button>
                <Button>Start Contributing</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}