
import React, { useState, useCallback } from 'react';
import { Calendar, Users, Clock, Settings, Download, Upload, Play } from 'lucide-react';

const ShiftScheduler = () => {
  const [employees, setEmployees] = useState([
    { 
      id: 1, 
      name: '田中太郎', 
      type: '社員', 
      maxHours: 40, 
      availableDays: ['月','火','水','木','金'], 
      minRestDays: 2,
      maxConsecutiveDays: 5,
      canWorkNight: true,
      preferredShifts: ['morning', 'afternoon'],
      skillLevel: 'senior',
      hourlyRate: 2000,
      ngCombinations: [2], // 佐藤花子とNG
      ngShifts: ['night'], // 夜勤NG
      mustWorkWith: [], // 必須ペア
      cannotOpenStore: false, // 開店業務不可
      cannotCloseStore: false, // 閉店業務不可
      needsSupervision: false, // 監督が必要
      canSupervise: true, // 監督可能
      fixedShifts: {} // 固定シフト {日付: シフトID}
    },
    { 
      id: 2, 
      name: '佐藤花子', 
      type: 'パート', 
      maxHours: 25, 
      availableDays: ['月','水','金','土','日'], 
      minRestDays: 1,
      maxConsecutiveDays: 3,
      canWorkNight: false,
      preferredShifts: ['morning'],
      skillLevel: 'intermediate',
      hourlyRate: 1200,
      ngCombinations: [1, 3], // 田中太郎、鈴木一郎とNG
      ngShifts: ['afternoon'], // 遅番NG
      mustWorkWith: [],
      cannotOpenStore: false,
      cannotCloseStore: true, // 閉店業務不可
      needsSupervision: true, // 監督が必要
      canSupervise: false,
      fixedShifts: {}
    },
    { 
      id: 3, 
      name: '鈴木一郎', 
      type: '社員', 
      maxHours: 40, 
      availableDays: ['火','水','木','金','土'], 
      minRestDays: 2,
      maxConsecutiveDays: 5,
      canWorkNight: true,
      preferredShifts: ['afternoon', 'night'],
      skillLevel: 'senior',
      hourlyRate: 2200,
      ngCombinations: [],
      ngShifts: [],
      mustWorkWith: [4], // 高橋美咲と必須ペア
      cannotOpenStore: false,
      cannotCloseStore: false,
      needsSupervision: false,
      canSupervise: true,
      fixedShifts: {}
    },
    { 
      id: 4, 
      name: '高橋美咲', 
      type: 'パート', 
      maxHours: 20, 
      availableDays: ['月','火','木','日'], 
      minRestDays: 2,
      maxConsecutiveDays: 3,
      canWorkNight: false,
      preferredShifts: ['morning', 'afternoon'],
      skillLevel: 'beginner',
      hourlyRate: 1000,
      ngCombinations: [],
      ngShifts: [],
      mustWorkWith: [],
      cannotOpenStore: true, // 開店業務不可
      cannotCloseStore: true, // 閉店業務不可
      needsSupervision: true, // 監督が必要
      canSupervise: false,
      fixedShifts: { '15': 'morning' } // 15日は早番固定
    }
  ]);

  const [shiftConstraints, setShiftConstraints] = useState({
    morning: { needsOpener: true, needsSupervisor: true, minStaff: 2, maxStaff: 4 },
    afternoon: { needsOpener: false, needsSupervisor: true, minStaff: 2, maxStaff: 5 },
    night: { needsOpener: false, needsSupervisor: true, minStaff: 1, maxStaff: 2, needsCloser: true }
  });

  const [businessTasks, setBusinessTasks] = useState([
    { id: 'open', name: '開店業務', description: '店舗の開店準備、レジ起動、清掃確認' },
    { id: 'close', name: '閉店業務', description: '売上確認、レジ締め、店舗施錠' },
    { id: 'cash_management', name: '金銭管理', description: 'レジ金の管理、売上計算' },
    { id: 'inventory', name: '在庫管理', description: '商品補充、発注業務' }
  ]);

  const [ngCombinationRules, setNgCombinationRules] = useState([
    { id: 1, employee1: 1, employee2: 2, reason: '勤務スタイルの違い', isActive: true },
    { id: 2, employee1: 2, employee2: 3, reason: 'コミュニケーション問題', isActive: true }
  ]);

  const [showBusinessTaskManager, setShowBusinessTaskManager] = useState(false);
  const [showNGRuleManager, setShowNGRuleManager] = useState(false);
  const [newBusinessTask, setNewBusinessTask] = useState({ name: '', description: '' });
  const [newNGRule, setNewNGRule] = useState({ employee1: '', employee2: '', reason: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [editingNGRule, setEditingNGRule] = useState(null);

  const [globalConstraints, setGlobalConstraints] = useState({
    maxConsecutiveDays: 5,
    minRestBetweenShifts: 12,
    noBackToBackNightShifts: true,
    weekendRequirement: { 社員: 1, パート: 1 },
    supervisionRatio: 0.5, // 監督者の割合
    allowSameShiftNGCombos: false // 同じシフト内でのNG組み合わせを許可するか
  });

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    type: '社員',
    maxHours: 40,
    availableDays: [],
    minRestDays: 2,
    maxConsecutiveDays: 5,
    canWorkNight: true,
    preferredShifts: [],
    skillLevel: 'intermediate',
    hourlyRate: 1500,
    ngCombinations: [],
    ngShifts: [],
    mustWorkWith: [],
    cannotOpenStore: false,
    cannotCloseStore: false,
    needsSupervision: false,
    canSupervise: false,
    fixedShifts: {}
  });

  const [showConstraintSettings, setShowConstraintSettings] = useState(false);

  const [shiftTypes] = useState([
    { id: 'morning', name: '早番', time: '09:00-17:00', hours: 8, requiredStaff: { 社員: 1, パート: 1 } },
    { id: 'afternoon', name: '遅番', time: '13:00-21:00', hours: 8, requiredStaff: { 社員: 1, パート: 1 } },
    { id: 'night', name: '夜勤', time: '21:00-09:00', hours: 8, requiredStaff: { 社員: 1, パート: 0 } }
  ]);

  const [constraints] = useState({
    maxConsecutiveDays: 5,
    minRestBetweenShifts: 12, // 時間
    noBackToBackNightShifts: true,
    weekendRequirement: { 社員: 1, パート: 1 }
  });

  const [currentMonth, setCurrentMonth] = useState('2025-07');
  const [requestedDaysOff, setRequestedDaysOff] = useState({});
  const [generatedSchedule, setGeneratedSchedule] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  // 以下省略：チェック関数、JSX 部分など
};

export default ShiftScheduler;
