'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Server, Globe, Key, Shield, Database } from 'lucide-react'

export default function SettingsPage() {
    const [lmStudioUrl, setLmStudioUrl] = useState('http://localhost:1234')

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your research environment and AI configurations.</p>
                </div>
                <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="ai" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="ai">AI Providers</TabsTrigger>
                    <TabsTrigger value="research">Research</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-5 w-5" />
                                Local AI (LM Studio)
                            </CardTitle>
                            <CardDescription>Configure connection to your local LLM inference server.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="lm-studio-url">Base URL</Label>
                                <Input
                                    id="lm-studio-url"
                                    value={lmStudioUrl}
                                    onChange={(e) => setLmStudioUrl(e.target.value)}
                                    placeholder="http://localhost:1234"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="auto-connect" />
                                <Label htmlFor="auto-connect">Auto-connect on startup</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Cloud APIs
                            </CardTitle>
                            <CardDescription>Configure keys for Google Gemini, OpenAI, etc.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="google-key">Google Gemini API Key</Label>
                                <Input id="google-key" type="password" placeholder="AIwa..." />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="hf-key">HuggingFace User Access Token</Label>
                                <Input id="hf-key" type="password" placeholder="hf_..." />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="research" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sources & databases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Configuration for PubMed, Semantic Scholar, etc. coming soon.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="system" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Preferences</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Theme and notification settings.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
