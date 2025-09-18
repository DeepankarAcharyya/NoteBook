import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import noteService from '../services/noteService.js';

const useNoteStore = create(
  persist(
    (set, get) => ({
      // State
      notes: [],
      currentNote: null,
      searchQuery: '',
      selectedCategory: null,
      selectedTags: [],
      isLoading: false,
      error: null,
      lastSaved: null,
      isDirty: false,

      // Actions
      setNotes: (notes) => set({ notes }),
      
      setCurrentNote: (note) => set({ 
        currentNote: note,
        isDirty: false,
        error: null 
      }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setSelectedCategory: (categoryId) => set({ 
        selectedCategory: categoryId,
        selectedTags: [] // Clear tags when changing category
      }),
      
      setSelectedTags: (tags) => set({ selectedTags: tags }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      setDirty: (isDirty) => set({ isDirty }),

      // Note operations
      createNote: async (noteData = {}) => {
        set({ isLoading: true, error: null });
        
        try {
          const newNote = await noteService.createNote(noteData);
          const notes = get().notes;
          
          set({
            notes: [newNote, ...notes],
            currentNote: newNote,
            isLoading: false,
            isDirty: false
          });
          
          return newNote;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loadNotes: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const notes = await noteService.getAllNotes();
          set({ notes, isLoading: false });
          return notes;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loadNote: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const note = await noteService.getNoteById(id);
          set({ 
            currentNote: note, 
            isLoading: false,
            isDirty: false 
          });
          return note;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateNote: async (id, noteData) => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedNote = await noteService.updateNote(id, noteData);
          const notes = get().notes;
          
          const updatedNotes = notes.map(note => 
            note.id === id ? updatedNote : note
          );
          
          set({
            notes: updatedNotes,
            currentNote: updatedNote,
            isLoading: false,
            isDirty: false,
            lastSaved: new Date()
          });
          
          return updatedNote;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateCurrentNote: (updates) => {
        const currentNote = get().currentNote;
        if (!currentNote) return;

        const updatedNote = { ...currentNote, ...updates };
        set({ 
          currentNote: updatedNote,
          isDirty: true 
        });
      },

      saveCurrentNote: async () => {
        const { currentNote, updateNote } = get();
        if (!currentNote || !get().isDirty) return;

        try {
          await updateNote(currentNote.id, currentNote);
        } catch (error) {
          console.error('Error saving note:', error);
          throw error;
        }
      },

      deleteNote: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          await noteService.deleteNote(id);
          const notes = get().notes;
          const currentNote = get().currentNote;
          
          const updatedNotes = notes.filter(note => note.id !== id);
          const newCurrentNote = currentNote?.id === id ? null : currentNote;
          
          set({
            notes: updatedNotes,
            currentNote: newCurrentNote,
            isLoading: false,
            isDirty: false
          });
          
          return true;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      toggleFavorite: async (id) => {
        try {
          const updatedNote = await noteService.toggleFavorite(id);
          const notes = get().notes;
          const currentNote = get().currentNote;
          
          const updatedNotes = notes.map(note => 
            note.id === id ? updatedNote : note
          );
          
          const newCurrentNote = currentNote?.id === id ? updatedNote : currentNote;
          
          set({
            notes: updatedNotes,
            currentNote: newCurrentNote
          });
          
          return updatedNote;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Search and filtering
      searchNotes: async (query) => {
        set({ isLoading: true, error: null, searchQuery: query });
        
        try {
          const notes = await noteService.searchNotes(query);
          set({ notes, isLoading: false });
          return notes;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loadNotesByCategory: async (categoryId) => {
        set({ isLoading: true, error: null, selectedCategory: categoryId });
        
        try {
          const notes = await noteService.getNotesByCategory(categoryId);
          set({ notes, isLoading: false });
          return notes;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loadFavoriteNotes: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const notes = await noteService.getFavoriteNotes();
          set({ notes, isLoading: false });
          return notes;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loadRecentNotes: async (limit = 10) => {
        set({ isLoading: true, error: null });
        
        try {
          const notes = await noteService.getRecentNotes(limit);
          set({ notes, isLoading: false });
          return notes;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Utility methods
      clearError: () => set({ error: null }),
      
      clearSearch: () => set({ 
        searchQuery: '', 
        selectedCategory: null, 
        selectedTags: [] 
      }),

      getFilteredNotes: () => {
        const { notes, searchQuery, selectedCategory, selectedTags } = get();
        
        return notes.filter(note => {
          // Category filter
          if (selectedCategory && note.category_id !== selectedCategory) {
            return false;
          }
          
          // Tag filter
          if (selectedTags.length > 0) {
            const noteTagIds = note.tags?.map(tag => tag.id) || [];
            const hasSelectedTag = selectedTags.some(tagId => 
              noteTagIds.includes(tagId)
            );
            if (!hasSelectedTag) return false;
          }
          
          // Search query filter (client-side for real-time filtering)
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              note.title.toLowerCase().includes(query) ||
              note.content.toLowerCase().includes(query) ||
              note.tags?.some(tag => tag.name.toLowerCase().includes(query))
            );
          }
          
          return true;
        });
      }
    }),
    {
      name: 'note-store',
      partialize: (state) => ({
        // Only persist these fields
        selectedCategory: state.selectedCategory,
        selectedTags: state.selectedTags,
        searchQuery: state.searchQuery
      })
    }
  )
);

export default useNoteStore;
