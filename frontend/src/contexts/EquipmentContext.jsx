import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { machineImages } from '../assets/images';
import { useAuth } from './AuthContext';

const EquipmentContext = createContext(null);

const DEFAULT_ASSETS = [
  {
    id: 'AST-8821-V',
    name: 'Respironics V60 Ventilator',
    category: 'Ventilators',
    type: 'Non-invasive Ventilator',
    department: 'Intensive Care (ICU)',
    location: 'ICU - Bed 04',
    status: 'Active',
    isBackupReady: true,
    purchaseDate: '2022-03-15',
    clinicalUse: 'Provides positive pressure ventilation support for respiratory failure and COPD patients in intensive care units.',
    manufacturer: 'Philips Healthcare',
    serialNo: 'PH-V60-99824',
    health: 98,
    nextPM: '2025-11-12',
    warranty: 'Active (Expires Mar 2026)',
    img: machineImages.ventilator,
  },
  {
    id: 'DEF-402-B',
    name: 'BeneHeart D3 Defibrillator',
    category: 'Defibrillators',
    type: 'Biphasic Defibrillator & Monitor',
    department: 'Emergency (ER)',
    location: 'ER Bay 02',
    status: 'Maintenance',
    isBackupReady: false,
    purchaseDate: '2022-08-10',
    clinicalUse: 'Emergency cardiac resuscitation, manual defibrillation, AED mode, and transcutaneous pacing during cardiac arrests.',
    manufacturer: 'Mindray Medical',
    serialNo: 'MR-D3-44109',
    health: 72,
    nextPM: 'Overdue (3 Days)',
    warranty: 'Active (Expires Aug 2025)',
    img: machineImages.defibrillator,
  },
  {
    id: 'MX700-04',
    name: 'IntelliVue MX700 Monitor',
    category: 'Patient Monitors',
    type: 'Multi-parameter Patient Monitor',
    department: 'Intensive Care (ICU)',
    location: 'ICU - Bed 01',
    status: 'Active',
    isBackupReady: true,
    purchaseDate: '2021-02-01',
    clinicalUse: 'Continuous monitoring of ECG, SpO2, NIBP, invasive blood pressure, end-tidal CO2, and temperature in critical care.',
    manufacturer: 'Philips Healthcare',
    serialNo: 'PH-MX700-1120',
    health: 95,
    nextPM: '2025-04-15',
    warranty: 'Expired (Coverage under Hospital AMC)',
    img: machineImages.monitor,
  },
  {
    id: 'MON-B650-01',
    name: 'GE Carescape B650',
    category: 'Patient Monitors',
    type: 'Bedside Critical Care Monitor',
    department: 'Intensive Care (ICU)',
    location: 'ICU - Bed 08',
    status: 'Active',
    isBackupReady: true,
    purchaseDate: '2022-06-18',
    clinicalUse: 'Comprehensive hemodynamic and respiratory patient monitoring with wireless telemetry integration.',
    manufacturer: 'GE HealthCare',
    serialNo: 'GE-B650-9901',
    health: 96,
    nextPM: '2025-01-10',
    warranty: 'Active (Expires Jun 2025)',
    img: machineImages.geCarescape,
  },
  {
    id: 'DEF-ZOL-03',
    name: 'Zoll R Series / AED Plus',
    category: 'Defibrillators',
    type: 'Clinical Biphasic Defibrillator',
    department: 'Emergency (ER)',
    location: 'Trauma Bay 01',
    status: 'Active',
    isBackupReady: true,
    purchaseDate: '2023-01-05',
    clinicalUse: 'CPR dashboard feedback and high-energy biphasic resuscitation for cardiac emergency response.',
    manufacturer: 'Zoll Medical',
    serialNo: 'ZL-RSER-4412',
    health: 99,
    nextPM: '2025-01-05',
    warranty: 'Active (Expires Jan 2026)',
    img: machineImages.zollLifepak,
  },
  {
    id: 'INF-ALR-05',
    name: 'BD Alaris System',
    category: 'Infusion Pumps',
    type: 'Smart Infusion Pump',
    department: 'Surgery',
    location: 'OR-1 Suite',
    status: 'Active',
    isBackupReady: true,
    purchaseDate: '2022-09-12',
    clinicalUse: 'Guardrails dose error reduction software and modular multi-channel intravenous medication infusion.',
    manufacturer: 'BD CareFusion',
    serialNo: 'BD-ALR-7701',
    health: 97,
    nextPM: '2025-10-14',
    warranty: 'Active (Expires Sep 2025)',
    img: machineImages.bdAlaris,
  },
  {
    id: 'IMG-CARM-07',
    name: 'GE OEC 3D C-Arm',
    category: 'Imaging Systems',
    type: 'Surgical Mobile C-Arm',
    department: 'Surgery',
    location: 'OR-Hybrid Suite',
    status: 'Active',
    isBackupReady: false,
    purchaseDate: '2021-02-10',
    clinicalUse: '3D intraoperative fluoroscopic imaging for orthopedic, vascular, and cardiac surgical procedures.',
    manufacturer: 'GE HealthCare',
    serialNo: 'GE-OEC-309',
    health: 93,
    nextPM: '2025-12-10',
    warranty: 'Full OEM AMC',
    img: machineImages.geOecCarm,
  },
  {
    id: 'IMG-XRAY-08',
    name: 'Siemens Mobilett Elara Max X-ray',
    category: 'Imaging Systems',
    type: 'Mobile Digital X-ray',
    department: 'Radiology',
    location: 'Mobile Bay R-02',
    status: 'Active',
    isBackupReady: true,
    purchaseDate: '2022-07-14',
    clinicalUse: 'High-speed bedside digital radiography for ICU and emergency ward immobile patients.',
    manufacturer: 'Siemens Healthineers',
    serialNo: 'SM-ELR-8802',
    health: 94,
    nextPM: '2025-07-14',
    warranty: 'Active (Expires Jul 2025)',
    img: machineImages.siemensXray,
  },
  {
    id: 'IMG-US-09',
    name: 'Fujifilm Sonosite Ultrasound',
    category: 'Imaging Systems',
    type: 'Point-of-Care Ultrasound (POCUS)',
    department: 'Emergency (ER)',
    location: 'ER Ultrasound Cart',
    status: 'Active',
    isBackupReady: true,
    purchaseDate: '2023-04-01',
    clinicalUse: 'Point-of-care emergency ultrasound, FAST exams, vascular access guidance, and cardiac imaging.',
    manufacturer: 'Fujifilm Sonosite',
    serialNo: 'FF-SONO-1022',
    health: 100,
    nextPM: '2025-04-01',
    warranty: 'Active (Expires Apr 2028)',
    img: machineImages.sonositeUltrasound,
  },
  {
    id: 'MRI-102',
    name: 'Siemens Magnetom 3.0T MRI',
    category: 'Imaging Systems',
    type: 'High-Field MRI Scanner',
    department: 'Radiology',
    location: 'Room 102A',
    status: 'Active',
    isBackupReady: false,
    purchaseDate: '2020-01-20',
    clinicalUse: 'High-resolution neuro, musculoskeletal, cardiac, and abdominal magnetic resonance diagnostic imaging.',
    manufacturer: 'Siemens Healthineers',
    serialNo: 'SM-MAG-3001',
    health: 91,
    nextPM: '2025-12-20',
    warranty: 'Full Service Contract',
    img: machineImages.mri,
  },
];

const INITIAL_SERVICE_STATION = [
  {
    id: 'AST-8821-V',
    name: 'Respironics V60 Ventilator',
    category: 'Ventilators',
    department: 'Intensive Care (ICU)',
    actionType: 'Service',
    status: 'In Maintenance',
    reason: 'Compressor motor bearing vibration and pressure valve recalibration drift under continuous high load.',
    sentDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    expectedDeliveryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    technician: 'J. Miller (Bio-Tech Lead)',
    serviceVendor: 'Philips Factory Authorized Service',
    estimatedCost: '$450.00',
    priority: 'High',
    img: machineImages.ventilator,
  },
  {
    id: 'DEF-402-B',
    name: 'Mindray BeneHeart D3 Defibrillator',
    category: 'Defibrillators',
    department: 'Emergency (ER)',
    actionType: 'Recall',
    status: 'Safety Recall In-Progress',
    reason: 'Manufacturer safety recall (Notice #2023-REV4) for firmware update to internal capacitor discharge timer circuit.',
    sentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    expectedDeliveryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    technician: 'S. Chen (MedTech Corp)',
    serviceVendor: 'Mindray Global Safety Team',
    estimatedCost: '$0.00 (Warranty Recall)',
    priority: 'Critical',
    img: machineImages.defibrillator,
  },
  {
    id: 'CT-500-X',
    name: 'GE Revolution CT Tube Unit',
    category: 'Imaging Systems',
    department: 'Radiology',
    actionType: 'Replaced',
    status: 'Unit Replacement Ordered',
    reason: 'X-ray cathode tube assembly exceeded maximum recommended exposure filament hours; full tube replacement required.',
    sentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    expectedDeliveryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    technician: 'R. Davis (Lead Imaging Engineer)',
    serviceVendor: 'GE Healthcare Systems',
    estimatedCost: '$18,500.00',
    priority: 'High',
    img: machineImages.mri,
  },
  {
    id: 'MRI-102',
    name: 'Siemens Magnetom Cryo Loop',
    category: 'Imaging Systems',
    department: 'Radiology',
    actionType: 'Service',
    status: 'Cooling Overhaul',
    reason: 'Helium compressor chiller loop pressure warning during high gradient pulse sequences.',
    sentDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    technician: 'M. Vance (Siemens Tech Specialist)',
    serviceVendor: 'Siemens Healthineers Chiller Division',
    estimatedCost: '$2,850.00',
    priority: 'Medium',
    img: machineImages.mri,
  },
  {
    id: 'INF-3301-P',
    name: 'Alaris System Infusion Pump #3',
    category: 'Infusion Pumps',
    department: 'Surgery',
    actionType: 'Recall',
    status: 'Software Recall',
    reason: 'Manufacturer recall for drug library sync protocol update and occlusion sensor calibration standard.',
    sentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    technician: 'S. Chen',
    serviceVendor: 'BD Alaris Safety Dept',
    estimatedCost: '$0.00 (Recall)',
    priority: 'Medium',
    img: machineImages.infusionPump,
  },
  {
    id: 'MON-9910-A',
    name: 'Philips IntelliVue MX700 Screen',
    category: 'Patient Monitors',
    department: 'Intensive Care (ICU)',
    actionType: 'Replaced',
    status: 'Display Replacement',
    reason: 'Touchscreen digitizer physical damage and backlight dimming; replacing front glass digitizer module.',
    sentDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    technician: 'J. Miller',
    serviceVendor: 'Philips Components Inc',
    estimatedCost: '$620.00',
    priority: 'Low',
    img: machineImages.monitor,
  },
];

const INITIAL_SERVICE_HISTORY = [
  {
    workOrder: 'WO-2025-8821',
    assetId: 'AST-8821-V',
    equipment: 'Respironics V60 Ventilator',
    serviceType: 'Preventative Maintenance',
    technician: 'J. Miller (Senior Technician)',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    cost: '$450.00',
    status: 'Completed',
  },
  {
    workOrder: 'WO-2025-7104',
    assetId: 'MRI-102',
    equipment: 'Siemens Magnetom MRI',
    serviceType: 'Cooling Loop Overhaul',
    technician: 'R. Davis (Senior Imaging Specialist)',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    cost: '$2,850.00',
    status: 'Completed',
  },
  {
    workOrder: 'WO-2025-5590',
    assetId: 'DEF-402-B',
    equipment: 'Mindray BeneHeart D3 Defibrillator',
    serviceType: 'Capacitor & Battery Calibration',
    technician: 'S. Chen (MedTech Specialist)',
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    cost: '$180.00',
    status: 'In Progress',
  },
  {
    workOrder: 'WO-2025-4100',
    assetId: 'MX700-04',
    equipment: 'Philips IntelliVue MX700 Monitor',
    serviceType: 'Touchscreen Digitizer Repair',
    technician: 'J. Miller (Senior Technician)',
    date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    cost: '$620.00',
    status: 'Completed',
  },
  {
    workOrder: 'WO-2025-3301',
    assetId: 'INF-3301-P',
    equipment: 'Alaris System Infusion Pump',
    serviceType: 'Occlusion Sensor Calibration',
    technician: 'J. Miller (Senior Technician)',
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    cost: '$290.00',
    status: 'Completed',
  },
];

export const EquipmentProvider = ({ children }) => {
  const { token, API_URL, authHeaders } = useAuth();

  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('medequip_assets');
    return saved ? JSON.parse(saved) : DEFAULT_ASSETS;
  });

  const [serviceStationList, setServiceStationList] = useState(() => {
    const saved = localStorage.getItem('medequip_service_station');
    return saved ? JSON.parse(saved) : INITIAL_SERVICE_STATION;
  });

  const [serviceHistoryList, setServiceHistoryList] = useState(() => {
    const saved = localStorage.getItem('medequip_service_history');
    return saved ? JSON.parse(saved) : INITIAL_SERVICE_HISTORY;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('medequip_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('medequip_service_station', JSON.stringify(serviceStationList));
  }, [serviceStationList]);

  useEffect(() => {
    localStorage.setItem('medequip_service_history', JSON.stringify(serviceHistoryList));
  }, [serviceHistoryList]);

  // Fetch backend equipment and service requests when available
  const syncWithBackend = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/equipment?page_size=100`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
          // Merge with image assets
          const mapped = data.items.map((item) => {
            let img = machineImages[item.machine_name] || machineImages[item.machine_id];
            if (!img) {
              if (item.category?.toLowerCase().includes('ventilator')) img = machineImages.ventilator;
              else if (item.category?.toLowerCase().includes('monitor')) img = machineImages.monitor;
              else if (item.category?.toLowerCase().includes('defibrillator')) img = machineImages.defibrillator;
              else if (item.category?.toLowerCase().includes('pump')) img = machineImages.infusionPump;
              else img = machineImages.mri;
            }
            return {
              id: item.machine_id,
              dbId: item.id,
              name: item.machine_name,
              category: item.category,
              type: `${item.category} Unit`,
              department: item.department,
              location: item.location || `${item.department} Bay`,
              status: item.status === 'AVAILABLE' ? 'Active' : (item.status === 'UNDER_MAINTENANCE' ? 'Maintenance' : item.status),
              isBackupReady: item.is_backup_ready,
              purchaseDate: item.purchase_date || new Date().toISOString().split('T')[0],
              clinicalUse: item.description || 'Clinical hospital equipment.',
              manufacturer: item.manufacturer || 'Certified Provider',
              serialNo: item.serial_number || `SN-${item.id}`,
              health: item.health_score || (item.status === 'AVAILABLE' ? 98 : 65),
              nextPM: '6 Months',
              warranty: item.warranty_expiry ? `Expires ${item.warranty_expiry}` : 'Active Hospital Warranty',
              img,
            };
          });
          setAssets(mapped);
        }
      }
    } catch (e) {
      console.warn('Could not sync equipment from backend:', e);
    }
  }, [token, API_URL, authHeaders]);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // Action: Add to Service Station from Health Prediction
  const addServiceStationItem = (item) => {
    const today = new Date();
    const sentDateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const deliveryDate = new Date(today.getTime() + (item.actionType === 'Recall' ? 21 : (item.actionType === 'Replaced' ? 30 : 10)) * 24 * 60 * 60 * 1000);
    const deliveryDateStr = deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let imgAsset = machineImages[item.name] || machineImages[item.id] || machineImages.ventilator;
    if (!imgAsset) {
      if (item.category === 'Patient Monitors') imgAsset = machineImages.monitor;
      else if (item.category === 'Defibrillators') imgAsset = machineImages.defibrillator;
      else if (item.category === 'Infusion Pumps') imgAsset = machineImages.infusionPump;
      else if (item.category === 'Imaging Systems') imgAsset = machineImages.mri;
    }

    const newItem = {
      id: item.id || `AST-${Math.floor(1000 + Math.random() * 9000)}-V`,
      name: item.name,
      category: item.category || 'Ventilators',
      department: item.department || 'Intensive Care (ICU)',
      actionType: item.actionType || 'Service',
      status: item.actionType === 'Recall' ? 'Safety Recall In-Progress' : (item.actionType === 'Replaced' ? 'Unit Replacement Ordered' : 'In Maintenance'),
      reason: item.reason || 'Diagnostic prediction detected failure risk.',
      sentDate: sentDateStr,
      expectedDeliveryDate: deliveryDateStr,
      technician: item.technician || 'J. Miller (Bio-Tech Lead)',
      serviceVendor: item.serviceVendor || `${item.name.split(' ')[0]} Authorized Service`,
      estimatedCost: item.actionType === 'Recall' ? '$0.00 (Warranty Recall)' : (item.actionType === 'Replaced' ? '$12,400.00' : '$480.00'),
      priority: item.priority || 'High',
      img: imgAsset,
    };

    setServiceStationList((prev) => [newItem, ...prev.filter((m) => m.id !== newItem.id)]);

    // Update the equipment status in Inventory to Maintenance or Recall
    setAssets((prev) =>
      prev.map((a) =>
        a.id === newItem.id
          ? { ...a, status: newItem.actionType === 'Recall' ? 'Recall' : 'Maintenance', health: Math.min(a.health, 60) }
          : a
      )
    );

    // Also persist service request in backend if connected
    if (token) {
      fetch(`${API_URL}/service-requests`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          equipment_id: 1, // Fallback equipment ID
          priority: item.priority === 'Critical' ? 'CRITICAL' : 'HIGH',
          issue: item.reason || 'Automated health assessment flagged equipment risk.',
          risk_score: item.riskScore || 75.0,
        }),
      }).catch((e) => console.warn('Could not persist service request:', e));
    }

    return newItem;
  };

  // Action: Complete Service in Service Station
  const completeServiceStationItem = (itemId, notes = '') => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const item = serviceStationList.find((m) => m.id === itemId);

    if (item) {
      // Add completed record to Service History
      const historyEntry = {
        workOrder: `WO-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        assetId: item.id,
        equipment: item.name,
        serviceType: item.actionType === 'Recall' ? 'Recall Remediation & Safety Clearance' : (item.actionType === 'Replaced' ? 'Full Unit Replacement & Validation' : 'Preventative Maintenance & Calibration'),
        technician: item.technician || 'J. Miller (Senior Technician)',
        date: dateStr,
        cost: item.estimatedCost || '$450.00',
        status: 'Completed',
        notes: notes || 'Service completed successfully. Equipment passed standard diagnostic calibration tests.',
      };

      setServiceHistoryList((prev) => [historyEntry, ...prev]);

      // Remove from active Service Station
      setServiceStationList((prev) => prev.filter((m) => m.id !== itemId));

      // Reset equipment back to Active / Available in Hospital Inventory
      setAssets((prev) =>
        prev.map((a) =>
          a.id === itemId
            ? { ...a, status: 'Active', health: 99, nextPM: '6 Months' }
            : a
        )
      );
    }
  };

  // Action: Mark Service as Late / Delayed
  const markServiceStationDelayed = (itemId, delayReason = 'Awaiting OEM replacement parts') => {
    const today = new Date();
    const newDeliveryDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const newDeliveryDateStr = newDeliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    setServiceStationList((prev) =>
      prev.map((m) =>
        m.id === itemId
          ? {
              ...m,
              status: 'Service Delayed / Overdue',
              expectedDeliveryDate: newDeliveryDateStr,
              reason: `${m.reason} [DELAY NOTICE: ${delayReason}]`,
            }
          : m
      )
    );

    // Also update history item status
    const item = serviceStationList.find((m) => m.id === itemId);
    if (item) {
      setServiceHistoryList((prev) => [
        {
          workOrder: `WO-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          assetId: item.id,
          equipment: item.name,
          serviceType: 'Service Delay Logged',
          technician: item.technician || 'J. Miller',
          date: today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          cost: '$0.00',
          status: 'In Progress',
          notes: `Service delayed. ${delayReason}. New expected delivery: ${newDeliveryDateStr}`,
        },
        ...prev,
      ]);
    }
  };

  // Action: Convert to Safety Recall
  const recallServiceStationItem = (itemId, recallNotice = 'Class I Safety Recall Notice') => {
    setServiceStationList((prev) =>
      prev.map((m) =>
        m.id === itemId
          ? {
              ...m,
              actionType: 'Recall',
              status: 'Safety Recall In-Progress',
              priority: 'Critical',
              reason: `Escalated to Manufacturer Recall: ${recallNotice}. Full safety firmware and hardware inspection required.`,
              estimatedCost: '$0.00 (Warranty Recall)',
            }
          : m
      )
    );

    // Update equipment inventory status to Recall
    setAssets((prev) =>
      prev.map((a) =>
        a.id === itemId ? { ...a, status: 'Recall', health: 45 } : a
      )
    );
  };

  // Action: Add new machine to inventory & SQL
  const addEquipment = async (newMachine) => {
    let imgAsset = machineImages[newMachine.name] || machineImages.ventilator;
    if (!imgAsset) {
      if (newMachine.category === 'Patient Monitors') imgAsset = machineImages.monitor;
      else if (newMachine.category === 'Defibrillators') imgAsset = machineImages.defibrillator;
      else if (newMachine.category === 'Imaging Systems') imgAsset = machineImages.mri;
      else if (newMachine.category === 'Infusion Pumps') imgAsset = machineImages.infusionPump;
    }

    const machineId = newMachine.id || `AST-${Math.floor(1000 + Math.random() * 9000)}-N`;
    const createdAsset = {
      id: machineId,
      name: newMachine.name,
      category: newMachine.category,
      type: `${newMachine.category} Standard Unit`,
      department: newMachine.department || 'General Wards',
      location: newMachine.location || `${newMachine.department} Bay`,
      status: 'Active',
      isBackupReady: Boolean(newMachine.isBackupReady),
      purchaseDate: newMachine.purchaseDate || new Date().toISOString().split('T')[0],
      clinicalUse: newMachine.clinicalUse || 'Clinical diagnosis and patient vital monitoring.',
      manufacturer: newMachine.manufacturer || 'Certified Provider',
      serialNo: newMachine.serialNo || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      health: 100,
      nextPM: '6 Months',
      warranty: 'Standard Hospital Warranty (2 Years)',
      img: imgAsset,
    };

    setAssets((prev) => [createdAsset, ...prev]);

    // Send to backend SQL
    if (token) {
      try {
        const payload = {
          machine_id: machineId,
          machine_name: newMachine.name,
          category: newMachine.category,
          department: newMachine.department || 'General Wards',
          location: newMachine.location || `${newMachine.department} Bay`,
          serial_number: createdAsset.serialNo,
          manufacturer: createdAsset.manufacturer,
          description: createdAsset.clinicalUse,
          status: 'AVAILABLE',
          is_backup_ready: Boolean(newMachine.isBackupReady),
          purchase_date: createdAsset.purchaseDate,
        };
        await fetch(`${API_URL}/equipment`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.warn('Backend SQL save failed, local state updated:', e);
      }
    }

    return createdAsset;
  };

  // Action: Delete machine from inventory & SQL
  const deleteEquipment = async (equipmentId) => {
    // Remove from local inventory
    setAssets((prev) => prev.filter((a) => a.id !== equipmentId && a.dbId !== equipmentId));
    // Remove from Service Station if present
    setServiceStationList((prev) => prev.filter((m) => m.id !== equipmentId));

    // Call backend SQL delete
    if (token) {
      try {
        await fetch(`${API_URL}/equipment/${equipmentId}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
      } catch (e) {
        console.warn('Backend SQL delete failed, local state updated:', e);
      }
    }
  };

  return (
    <EquipmentContext.Provider
      value={{
        assets,
        serviceStationList,
        serviceHistoryList,
        addServiceStationItem,
        completeServiceStationItem,
        markServiceStationDelayed,
        recallServiceStationItem,
        addEquipment,
        deleteEquipment,
        syncWithBackend,
      }}
    >
      {children}
    </EquipmentContext.Provider>
  );
};

export const useEquipment = () => {
  const context = useContext(EquipmentContext);
  if (!context) {
    throw new Error('useEquipment must be used within an EquipmentProvider');
  }
  return context;
};
