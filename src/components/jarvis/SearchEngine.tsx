import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, Tag, MessageSquare, Brain, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useJarvisLocal } from '@/hooks/useJarvisLocal';
import { Conversation, Memory } from '@/lib/jarvis-db';

type SearchType = 'all' | 'conversations' | 'memories';
type SortBy = 'relevance' | 'date' | 'category';

export const SearchEngine: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    conversations: Conversation[];
    memories: Memory[];
  }>({ conversations: [], memories: [] });

  const { searchConversations, searchMemory, getAllConversations, getAllMemories } = useJarvisLocal();

  // Get all categories for filtering
  const categories = useMemo(async () => {
    const conversations = await getAllConversations();
    const memories = await getAllMemories();
    
    const convCategories = [...new Set(conversations.map(c => c.category))];
    const memCategories = [...new Set(memories.map(m => m.category))];
    
    return [...new Set([...convCategories, ...memCategories])];
  }, [getAllConversations, getAllMemories]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      let conversations: Conversation[] = [];
      let memories: Memory[] = [];

      if (searchType === 'all' || searchType === 'conversations') {
        conversations = await searchConversations(searchQuery, 20);
      }

      if (searchType === 'all' || searchType === 'memories') {
        memories = await searchMemory(searchQuery, 20);
      }

      // Apply category filter
      if (selectedCategory !== 'all') {
        conversations = conversations.filter(c => c.category === selectedCategory);
        memories = memories.filter(m => m.category === selectedCategory);
      }

      // Apply sorting
      conversations.sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          case 'category':
            return a.category.localeCompare(b.category);
          default: // relevance
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
      });

      memories.sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          case 'category':
            return a.category.localeCompare(b.category);
          default: // relevance
            return (b.relevance_score || 0) - (a.relevance_score || 0);
        }
      });

      setSearchResults({ conversations, memories });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const highlightText = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalResults = searchResults.conversations.length + searchResults.memories.length;

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Smart Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search conversations, memories, and facts..."
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Search in" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="conversations">Conversations</SelectItem>
                <SelectItem value="memories">Memories</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Tips */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Use quotes for exact phrases: "machine learning"</p>
            <p>• Search by category, tags, or content</p>
            <p>• Results are searched across all stored conversations and memories</p>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {totalResults > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Search Results</span>
              <Badge variant="secondary">
                {totalResults} {totalResults === 1 ? 'result' : 'results'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {/* Conversations */}
                {searchResults.conversations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4" />
                      <h4 className="font-medium">Conversations ({searchResults.conversations.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {searchResults.conversations.map((conversation) => (
                        <Card key={conversation.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-sm" 
                                dangerouslySetInnerHTML={{ 
                                  __html: highlightText(conversation.title, searchQuery) 
                                }} 
                            />
                            <Badge variant="outline" className="ml-2">
                              {conversation.category}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDate(conversation.updated_at)}
                          </div>
                          
                          {/* Show first matching message */}
                          {conversation.messages.find(m => 
                            m.content.toLowerCase().includes(searchQuery.toLowerCase())
                          ) && (
                            <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded mt-2">
                              <div className="font-medium text-xs mb-1">Matching content:</div>
                              <div 
                                dangerouslySetInnerHTML={{ 
                                  __html: highlightText(
                                    conversation.messages.find(m => 
                                      m.content.toLowerCase().includes(searchQuery.toLowerCase())
                                    )?.content.slice(0, 200) + '...' || '',
                                    searchQuery
                                  )
                                }} 
                              />
                            </div>
                          )}
                          
                          {conversation.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {conversation.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.conversations.length > 0 && searchResults.memories.length > 0 && (
                  <Separator />
                )}

                {/* Memories */}
                {searchResults.memories.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-4 w-4" />
                      <h4 className="font-medium">Memories ({searchResults.memories.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {searchResults.memories.map((memory) => (
                        <Card key={memory.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline">
                              {memory.category}
                            </Badge>
                            {memory.relevance_score && (
                              <Badge variant="secondary" className="ml-2">
                                <TrendingUp className="h-2 w-2 mr-1" />
                                {Math.round(memory.relevance_score * 100)}%
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm mb-2" 
                               dangerouslySetInnerHTML={{ 
                                 __html: highlightText(memory.content, searchQuery) 
                               }} 
                          />
                          
                          <div className="text-xs text-muted-foreground mb-2">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDate(memory.timestamp)}
                          </div>
                          
                          {memory.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {memory.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchQuery && totalResults === 0 && !isSearching && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Check spelling and try different keywords</p>
              <p>• Remove filters to broaden your search</p>
              <p>• Try searching for partial words or phrases</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};