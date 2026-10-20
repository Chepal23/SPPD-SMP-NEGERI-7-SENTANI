import React from 'react';
import { ActiveTab } from '../types';
import { 
  FileText, 
  Users, 
  FileCheck, 
  Calendar,
  Settings, 
  Code2, 
  LayoutDashboard,
  Plus
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickAction: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onQuickAction }) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button 
            onClick={() => onTabChange('dashboard')}
            className="text-left font-bold tracking-tight text-slate-900 text-lg whitespace-nowrap shrink-0 hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
              S
            </span>
            <span className="font-semibold text-slate-900 text-base">
              SIMPEL-SPPD
            </span>
          </button>

          {/* Zone 2: Concise single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium text-slate-600">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-2.5 xl:px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'text-indigo-700 bg-indigo-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('pegawai')}
              className={`px-2.5 xl:px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'pegawai'
                  ? 'text-indigo-700 bg-indigo-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pegawai</span>
            </button>

            <button
              onClick={() => onTabChange('spt')}
              className={`px-2.5 xl:px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'spt'
                  ? 'text-indigo-700 bg-indigo-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Data SPT</span>
            </button>

            <button
              onClick={() => onTabChange('sppd')}
              className={`px-2.5 xl:px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'sppd'
                  ? 'text-indigo-700 bg-indigo-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Data SPPD</span>
            </button>

            <button
              onClick={() => onTabChange('rapat')}
              className={`px-2.5 xl:px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'rapat'
                  ? 'text-indigo-700 bg-indigo-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Manajemen Rapat</span>
            </button>

            <button
              onClick={() => onTabChange('pengaturan')}
              className={`px-2.5 xl:px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'pengaturan'
                  ? 'text-indigo-700 bg-indigo-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan Kop</span>
            </button>

            <button
              onClick={() => onTabChange('gas-hub')}
              className={`px-2.5 xl:px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'gas-hub'
                  ? 'text-indigo-700 bg-indigo-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Apps Script</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onQuickAction}
              className="px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Buat SPT Baru</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Strip */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('pegawai')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${activeTab === 'pegawai' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'}`}
          >
            Pegawai
          </button>
          <button
            onClick={() => onTabChange('spt')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${activeTab === 'spt' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'}`}
          >
            Data SPT
          </button>
          <button
            onClick={() => onTabChange('sppd')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${activeTab === 'sppd' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'}`}
          >
            Data SPPD
          </button>
          <button
            onClick={() => onTabChange('rapat')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${activeTab === 'rapat' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'}`}
          >
            Rapat & Notulen
          </button>
          <button
            onClick={() => onTabChange('pengaturan')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${activeTab === 'pengaturan' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'}`}
          >
            Pengaturan
          </button>
          <button
            onClick={() => onTabChange('gas-hub')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap shrink-0 ${activeTab === 'gas-hub' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'}`}
          >
            Apps Script
          </button>
        </div>
      </div>
    </header>
  );
};
