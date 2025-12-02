# Real-time Data Synchronization Guide

This comprehensive guide explains how HEALA implements real-time data synchronization across all features and how to replicate this in Flutter for Android and iOS.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Realtime Features by Module](#realtime-features-by-module)
3. [Implementation Patterns](#implementation-patterns)
4. [Flutter Implementation Guide](#flutter-implementation-guide)
5. [Testing & Debugging](#testing--debugging)
6. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### How Realtime Works in HEALA

HEALA uses **Supabase Realtime** which is built on **PostgreSQL's logical replication** and **Phoenix Channels**. This provides:

- **Low-latency updates**: Changes are pushed to clients in milliseconds
- **Automatic reconnection**: Handles network interruptions gracefully
- **Filtered subscriptions**: Only receive relevant data updates
- **Presence tracking**: Track online/offline status of users

### Core Components

```
┌─────────────────────────────────────────────────┐
│           Frontend Application                   │
│  ┌──────────────────────────────────────────┐  │
│  │     Component with State                  │  │
│  │  - Display data                           │  │
│  │  - Handle user interactions               │  │
│  └──────────────┬───────────────────────────┘  │
│                 │                                │
│  ┌──────────────▼───────────────────────────┐  │
│  │     Realtime Hook/Service                 │  │
│  │  - Set up subscriptions                   │  │
│  │  - Handle events (INSERT/UPDATE/DELETE)   │  │
│  │  - Update local state                     │  │
│  └──────────────┬───────────────────────────┘  │
│                 │                                │
│  ┌──────────────▼───────────────────────────┐  │
│  │     Supabase Client                       │  │
│  │  - Manage WebSocket connection            │  │
│  │  - Subscribe to channels                  │  │
│  │  - Emit events                            │  │
│  └──────────────┬───────────────────────────┘  │
└─────────────────┼───────────────────────────────┘
                  │
                  │ WebSocket Connection
                  │
┌─────────────────▼───────────────────────────────┐
│           Supabase Backend                       │
│  ┌──────────────────────────────────────────┐  │
│  │     Realtime Server                       │  │
│  │  - Manage channels                        │  │
│  │  - Broadcast changes                      │  │
│  │  - Filter messages                        │  │
│  └──────────────┬───────────────────────────┘  │
│                 │                                │
│  ┌──────────────▼───────────────────────────┐  │
│  │     PostgreSQL Database                   │  │
│  │  - Store data                             │  │
│  │  - Trigger change events                  │  │
│  │  - Enforce RLS policies                   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Realtime Features by Module

### 1. Admin Dashboard

**Location**: `src/components/admin/AdminDashboardOverview.tsx`

**Real-time Updates**:
- Total users count
- Pending verifications
- Emergency alerts
- Pending disputes
- User activity today

**Tables Monitored**:
```typescript
const tables = [
  'profiles',              // User management
  'verification_requests', // Verification status
  'emergency_requests',    // Emergency alerts
  'financial_disputes',    // Dispute resolution
  'user_activity_logs'     // Activity tracking
];
```

**Web Implementation**:
```typescript
useEffect(() => {
  fetchStats();
  
  // Polling fallback (every 30 seconds)
  const interval = setInterval(fetchStats, 30000);
  
  // Real-time subscriptions
  const channel = supabase
    .channel('admin-dashboard-updates')
    .on('postgres_changes', { 
      event: '*',           // Listen to INSERT, UPDATE, DELETE
      schema: 'public', 
      table: 'profiles' 
    }, fetchStats)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'verification_requests' 
    }, fetchStats)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'emergency_requests' 
    }, fetchStats)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'financial_disputes' 
    }, fetchStats)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'user_activity_logs' 
    }, fetchStats)
    .subscribe();

  return () => {
    clearInterval(interval);
    supabase.removeChannel(channel);
  };
}, []);
```

**Flutter Implementation**:
```dart
class AdminDashboardService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  RealtimeChannel? _channel;
  Timer? _pollingTimer;
  
  void subscribeToAdminUpdates(Function() onUpdate) {
    // Set up polling fallback
    _pollingTimer = Timer.periodic(
      Duration(seconds: 30), 
      (_) => onUpdate()
    );
    
    // Set up realtime subscription
    _channel = _supabase
      .channel('admin-dashboard-updates')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'profiles',
        callback: (_) => onUpdate(),
      )
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'verification_requests',
        callback: (_) => onUpdate(),
      )
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'emergency_requests',
        callback: (_) => onUpdate(),
      )
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'financial_disputes',
        callback: (_) => onUpdate(),
      )
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'user_activity_logs',
        callback: (_) => onUpdate(),
      )
      .subscribe();
  }
  
  Future<void> unsubscribe() async {
    _pollingTimer?.cancel();
    if (_channel != null) {
      await _supabase.removeChannel(_channel!);
      _channel = null;
    }
  }
}
```

**Usage in Flutter Widget**:
```dart
class AdminDashboardScreen extends StatefulWidget {
  @override
  _AdminDashboardScreenState createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  final AdminDashboardService _service = AdminDashboardService();
  Map<String, dynamic> _stats = {};
  
  @override
  void initState() {
    super.initState();
    _fetchStats();
    _service.subscribeToAdminUpdates(_fetchStats);
  }
  
  @override
  void dispose() {
    _service.unsubscribe();
    super.dispose();
  }
  
  Future<void> _fetchStats() async {
    // Fetch dashboard statistics
    final stats = await _fetchDashboardStats();
    if (mounted) {
      setState(() {
        _stats = stats;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    // Build UI with _stats
  }
}
```

---

### 2. Hospital Emergency Management

**Location**: `src/components/hospital/HospitalEmergencyManagement.tsx`

**Real-time Updates**:
- New emergency requests
- Status changes (pending → accepted → completed)
- Request assignments to physicians

**Tables Monitored**:
- `emergency_requests` (filtered by hospital_id)

**Web Implementation**:
```typescript
useEffect(() => {
  if (profile?.hospital_id) {
    fetchEmergencyRequests();
    
    const channel = supabase
      .channel('emergency-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'emergency_requests',
        filter: `hospital_id=eq.${profile.hospital_id}` // Filter by hospital
      }, () => {
        fetchEmergencyRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}, [profile?.hospital_id]);
```

**Flutter Implementation**:
```dart
class EmergencyManagementService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  RealtimeChannel? _channel;
  
  void subscribeToEmergencyUpdates(
    String hospitalId,
    Function() onUpdate,
  ) {
    _channel = _supabase
      .channel('emergency-updates')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'emergency_requests',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'hospital_id',
          value: hospitalId,
        ),
        callback: (_) => onUpdate(),
      )
      .subscribe();
  }
  
  Future<void> unsubscribe() async {
    if (_channel != null) {
      await _supabase.removeChannel(_channel!);
      _channel = null;
    }
  }
}
```

---

### 3. Hospital Notifications

**Location**: `src/components/hospital/HospitalNotificationCenter.tsx`

**Real-time Updates**:
- New notification arrival
- Immediate display to user
- Badge count updates

**Tables Monitored**:
- `notifications` (filtered by user_id)

**Web Implementation**:
```typescript
useEffect(() => {
  if (user) {
    fetchNotifications();
    
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: 'INSERT',  // Only listen to new notifications
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as any;
        const validNotification: Notification = {
          id: newNotification.id,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          read: newNotification.read,
          created_at: newNotification.created_at,
        };
        
        // Prepend new notification to list
        setNotifications(prev => [validNotification, ...prev]);
        
        // Show toast
        toast({
          title: validNotification.title,
          description: validNotification.message,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}, [user]);
```

**Flutter Implementation**:
```dart
class NotificationService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  RealtimeChannel? _channel;
  
  void subscribeToNotifications(
    String userId,
    Function(Map<String, dynamic>) onNewNotification,
  ) {
    _channel = _supabase
      .channel('notifications')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'notifications',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'user_id',
          value: userId,
        ),
        callback: (payload) {
          final notification = payload.newRecord;
          onNewNotification(notification);
          
          // Show local notification
          _showLocalNotification(
            notification['title'] as String,
            notification['message'] as String,
          );
        },
      )
      .subscribe();
  }
  
  void _showLocalNotification(String title, String message) {
    // Use flutter_local_notifications package
    // Implementation details...
  }
  
  Future<void> unsubscribe() async {
    if (_channel != null) {
      await _supabase.removeChannel(_channel!);
      _channel = null;
    }
  }
}
```

---

### 4. Hospital Patient Management

**Location**: `src/components/hospital/patient-management/usePatientManagement.ts`

**Real-time Updates**:
- New patient admissions
- Patient status changes
- Discharge updates
- Room assignments

**Tables Monitored**:
- `hospital_patients` (filtered by hospital_id)

**Web Implementation**:
```typescript
useEffect(() => {
  if (user && profile?.hospital_id) {
    fetchPatients();
    
    const channel = supabase
      .channel('hospital_patients_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'hospital_patients',
        filter: `hospital_id=eq.${profile.hospital_id}`
      }, () => {
        console.log('Real-time update received for hospital_patients');
        fetchPatients();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}, [user, profile?.hospital_id]);
```

**Flutter Implementation**:
```dart
class PatientManagementService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  RealtimeChannel? _channel;
  
  void subscribeToPatientUpdates(
    String hospitalId,
    Function() onUpdate,
  ) {
    _channel = _supabase
      .channel('hospital_patients_updates')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'hospital_patients',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'hospital_id',
          value: hospitalId,
        ),
        callback: (payload) {
          print('Real-time update: ${payload.eventType}');
          onUpdate();
        },
      )
      .subscribe();
  }
  
  Future<void> unsubscribe() async {
    if (_channel != null) {
      await _supabase.removeChannel(_channel!);
      _channel = null;
    }
  }
}
```

---

### 5. Hospital Resource Management

**Location**: `src/components/hospital/resource-management/useResourceData.ts`

**Real-time Updates**:
- Equipment availability changes
- Resource status updates (available → in_use → maintenance)
- Quantity updates

**Tables Monitored**:
- `hospital_resources` (filtered by hospital_id)

**Web Implementation**:
```typescript
useEffect(() => {
  if (user && profile?.hospital_id) {
    fetchResources();
    
    const channel = supabase
      .channel('hospital_resources_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'hospital_resources',
        filter: `hospital_id=eq.${profile.hospital_id}`
      }, () => {
        console.log('Real-time update received for hospital_resources');
        fetchResources();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}, [user, profile?.hospital_id]);
```

**Flutter Implementation**:
```dart
class ResourceManagementService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  RealtimeChannel? _channel;
  
  void subscribeToResourceUpdates(
    String hospitalId,
    Function() onUpdate,
  ) {
    _channel = _supabase
      .channel('hospital_resources_updates')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'hospital_resources',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'hospital_id',
          value: hospitalId,
        ),
        callback: (payload) {
          print('Resource update: ${payload.eventType}');
          onUpdate();
        },
      )
      .subscribe();
  }
  
  Future<void> unsubscribe() async {
    if (_channel != null) {
      await _supabase.removeChannel(_channel!);
      _channel = null;
    }
  }
}
```

---

### 6. Hospital Waitlist

**Location**: `src/components/hospital/waitlist/useWaitlist.ts`

**Real-time Updates**:
- New patients joining waitlist
- Status changes (waiting → called → completed)
- Priority updates

**Tables Monitored**:
- `patient_waitlist` (filtered by hospital_id)

**Web Implementation**:
```typescript
useEffect(() => {
  if (user && profile?.hospital_id) {
    fetchWaitlist();
    
    const channel = supabase
      .channel('waitlist_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'patient_waitlist',
        filter: `hospital_id=eq.${profile.hospital_id}`
      }, () => {
        fetchWaitlist();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}, [user, profile?.hospital_id]);
```

**Flutter Implementation**:
```dart
class WaitlistService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  RealtimeChannel? _channel;
  
  void subscribeToWaitlistUpdates(
    String hospitalId,
    Function() onUpdate,
  ) {
    _channel = _supabase
      .channel('waitlist_updates')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'patient_waitlist',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'hospital_id',
          value: hospitalId,
        ),
        callback: (_) => onUpdate(),
      )
      .subscribe();
  }
  
  Future<void> unsubscribe() async {
    if (_channel != null) {
      await _supabase.removeChannel(_channel!);
      _channel = null;
    }
  }
}
```

---

### 7. Enhanced Chat System

**Location**: `src/components/enhanced-chat/`

**Real-time Updates**:
- New message arrival
- Message read status
- Typing indicators
- Online/offline status

**Tables Monitored**:
- `messages` (filtered by conversation_id)

**Web Implementation**:

`src/components/enhanced-chat/services/realtimeService.ts`:
```typescript
export const subscribeToMessages = (
  conversationId: string,
  onMessageInsert: (message: Message) => void,
  onMessageUpdate: (message: Message) => void
) => {
  const transformMessage = (msg: any): Message => ({
    id: msg.id,
    content: msg.content,
    sender_type: msg.sender_type,
    sender_id: msg.sender_id,
    is_read: false,
    read_at: undefined,
    message_attachments: msg.metadata,
    created_at: msg.created_at
  });

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        const transformedMessage = transformMessage(payload.new as any);
        onMessageInsert(transformedMessage);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        const transformedMessage = transformMessage(payload.new as any);
        onMessageUpdate(transformedMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
```

`src/components/enhanced-chat/hooks/useEnhancedChat.ts`:
```typescript
const setupRealtimeSubscription = () => {
  const handleMessageInsert = (message: Message) => {
    setMessages(current => [...current, message]);
    
    // Show notification if message is from other user
    if (message.sender_id !== user?.id) {
      toast({
        title: "New Message",
        description: message.content.substring(0, 50),
      });
    }
  };

  const handleMessageUpdate = (message: Message) => {
    setMessages(current => 
      current.map(msg => 
        msg.id === message.id ? message : msg
      )
    );
  };

  return subscribeToMessages(
    conversationId,
    handleMessageInsert,
    handleMessageUpdate
  );
};
```

**Flutter Implementation**:

`lib/data/services/chat_realtime_service.dart`:
```dart
import 'package:supabase_flutter/supabase_flutter.dart';

class Message {
  final String id;
  final String content;
  final String senderType;
  final String senderId;
  final bool isRead;
  final DateTime? readAt;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  Message({
    required this.id,
    required this.content,
    required this.senderType,
    required this.senderId,
    required this.isRead,
    this.readAt,
    this.metadata,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'],
      content: json['content'],
      senderType: json['sender_type'],
      senderId: json['sender_id'],
      isRead: json['is_read'] ?? false,
      readAt: json['read_at'] != null ? DateTime.parse(json['read_at']) : null,
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class ChatRealtimeService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  RealtimeChannel? _channel;

  void subscribeToMessages(
    String conversationId,
    Function(Message) onMessageInsert,
    Function(Message) onMessageUpdate,
  ) {
    _channel = _supabase
        .channel('messages:$conversationId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversation_id',
            value: conversationId,
          ),
          callback: (payload) {
            final message = Message.fromJson(payload.newRecord);
            onMessageInsert(message);
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversation_id',
            value: conversationId,
          ),
          callback: (payload) {
            final message = Message.fromJson(payload.newRecord);
            onMessageUpdate(message);
          },
        )
        .subscribe();
  }

  Future<void> unsubscribe() async {
    if (_channel != null) {
      await _supabase.removeChannel(_channel!);
      _channel = null;
    }
  }
}
```

**Usage in Flutter Chat Screen**:
```dart
class ChatScreen extends StatefulWidget {
  final String conversationId;
  
  ChatScreen({required this.conversationId});

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ChatRealtimeService _realtimeService = ChatRealtimeService();
  final List<Message> _messages = [];
  
  @override
  void initState() {
    super.initState();
    _loadMessages();
    _setupRealtime();
  }
  
  void _setupRealtime() {
    _realtimeService.subscribeToMessages(
      widget.conversationId,
      (message) {
        // Handle new message
        setState(() {
          _messages.add(message);
        });
        
        // Show notification if from other user
        if (message.senderId != _getCurrentUserId()) {
          _showNotification('New Message', message.content);
        }
      },
      (message) {
        // Handle message update
        setState(() {
          final index = _messages.indexWhere((m) => m.id == message.id);
          if (index != -1) {
            _messages[index] = message;
          }
        });
      },
    );
  }
  
  @override
  void dispose() {
    _realtimeService.unsubscribe();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Chat')),
      body: ListView.builder(
        itemCount: _messages.length,
        itemBuilder: (context, index) {
          final message = _messages[index];
          return MessageBubble(message: message);
        },
      ),
    );
  }
}
```

---

### 8. Global Realtime Provider

**Location**: `src/components/realtime/RealtimeProvider.tsx`

**Purpose**: Provides app-wide realtime functionality

**Real-time Updates**:
- Emergency notifications (all ambulance requests)
- Chat notifications (all new messages)
- Connection status tracking
- Presence tracking (online users count)

**Web Implementation**:
```typescript
export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Emergency notifications channel
    const emergencyChannel = supabase
      .channel('emergency-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ambulance_requests'
        },
        (payload) => {
          const request = payload.new as any;
          toast({
            title: "🚨 Emergency Request",
            description: `New ${request.emergency_type} request from ${request.pickup_address}`,
            variant: "destructive"
          });
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const newState = emergencyChannel.presenceState();
        setConnectionCount(Object.keys(newState).length);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Chat notifications channel
    let chatChannel: any = null;
    if (user) {
      chatChannel = supabase
        .channel('chat-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            const message = payload.new as any;
            if (message.sender_id !== user.id) {
              toast({
                title: "💬 New Message",
                description: "You have a new message in your chat",
              });
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(emergencyChannel);
      if (chatChannel) {
        supabase.removeChannel(chatChannel);
      }
    };
  }, [user, toast]);

  const value = {
    isConnected,
    connectionCount
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
```

**Flutter Implementation**:

`lib/providers/realtime_provider.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class RealtimeProvider extends ChangeNotifier {
  final SupabaseClient _supabase = SupabaseConfig.client;
  RealtimeChannel? _emergencyChannel;
  RealtimeChannel? _chatChannel;
  
  bool _isConnected = false;
  int _connectionCount = 0;
  
  bool get isConnected => _isConnected;
  int get connectionCount => _connectionCount;
  
  void initialize(String userId) {
    _setupEmergencyChannel();
    _setupChatChannel(userId);
  }
  
  void _setupEmergencyChannel() {
    _emergencyChannel = _supabase
        .channel('emergency-notifications')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'ambulance_requests',
          callback: (payload) {
            final request = payload.newRecord;
            _showEmergencyNotification(
              '🚨 Emergency Request',
              'New ${request['emergency_type']} request from ${request['pickup_address']}',
            );
          },
        )
        .subscribe((status, error) {
          _isConnected = status == RealtimeSubscribeStatus.subscribed;
          notifyListeners();
        });
    
    // Track presence
    _emergencyChannel?.onPresenceSync((payload) {
      final presenceState = _emergencyChannel?.presenceState();
      _connectionCount = presenceState?.length ?? 0;
      notifyListeners();
    });
  }
  
  void _setupChatChannel(String userId) {
    _chatChannel = _supabase
        .channel('chat-notifications')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          callback: (payload) {
            final message = payload.newRecord;
            if (message['sender_id'] != userId) {
              _showChatNotification(
                '💬 New Message',
                'You have a new message in your chat',
              );
            }
          },
        )
        .subscribe();
  }
  
  void _showEmergencyNotification(String title, String body) {
    // Use flutter_local_notifications
    // Implementation details...
  }
  
  void _showChatNotification(String title, String body) {
    // Use flutter_local_notifications
    // Implementation details...
  }
  
  Future<void> dispose() async {
    if (_emergencyChannel != null) {
      await _supabase.removeChannel(_emergencyChannel!);
    }
    if (_chatChannel != null) {
      await _supabase.removeChannel(_chatChannel!);
    }
    super.dispose();
  }
}
```

**Wrap your app with the provider**:
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_ANON_KEY',
  );
  
  runApp(
    ChangeNotifierProvider(
      create: (_) => RealtimeProvider()..initialize(userId),
      child: MyApp(),
    ),
  );
}
```

---

## Implementation Patterns

### Pattern 1: Simple Refetch on Change

**When to use**: Simple data that doesn't require granular updates

```typescript
// Web
const channel = supabase
  .channel('simple-updates')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'my_table' 
  }, () => {
    fetchData(); // Refetch all data
  })
  .subscribe();
```

```dart
// Flutter
_channel = _supabase
  .channel('simple-updates')
  .onPostgresChanges(
    event: PostgresChangeEvent.all,
    schema: 'public',
    table: 'my_table',
    callback: (_) => _fetchData(),
  )
  .subscribe();
```

### Pattern 2: Optimistic Updates

**When to use**: Better UX, instant feedback

```typescript
// Web
const sendMessage = async (content: string) => {
  // Optimistic update
  const tempMessage = {
    id: crypto.randomUUID(),
    content,
    sender_id: user.id,
    created_at: new Date().toISOString(),
    sending: true
  };
  setMessages(prev => [...prev, tempMessage]);
  
  try {
    // Send to server
    const { data, error } = await supabase
      .from('messages')
      .insert({ content, sender_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    
    // Replace temp message with real one
    setMessages(prev => 
      prev.map(msg => msg.id === tempMessage.id ? data : msg)
    );
  } catch (error) {
    // Revert on error
    setMessages(prev => 
      prev.filter(msg => msg.id !== tempMessage.id)
    );
    toast.error('Failed to send message');
  }
};
```

```dart
// Flutter
Future<void> sendMessage(String content) async {
  // Optimistic update
  final tempMessage = Message(
    id: Uuid().v4(),
    content: content,
    senderId: _currentUserId,
    createdAt: DateTime.now(),
    sending: true,
  );
  
  setState(() {
    _messages.add(tempMessage);
  });
  
  try {
    final response = await _supabase
        .from('messages')
        .insert({'content': content, 'sender_id': _currentUserId})
        .select()
        .single();
    
    // Replace temp message with real one
    setState(() {
      final index = _messages.indexWhere((m) => m.id == tempMessage.id);
      if (index != -1) {
        _messages[index] = Message.fromJson(response);
      }
    });
  } catch (error) {
    // Revert on error
    setState(() {
      _messages.removeWhere((m) => m.id == tempMessage.id);
    });
    _showError('Failed to send message');
  }
}
```

### Pattern 3: Granular State Updates

**When to use**: Large lists, performance optimization

```typescript
// Web
const setupRealtimeSubscription = () => {
  const channel = supabase
    .channel('granular-updates')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'items'
    }, (payload) => {
      setItems(prev => [...prev, payload.new]);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'items'
    }, (payload) => {
      setItems(prev => 
        prev.map(item => 
          item.id === payload.new.id ? payload.new : item
        )
      );
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'items'
    }, (payload) => {
      setItems(prev => 
        prev.filter(item => item.id !== payload.old.id)
      );
    })
    .subscribe();
  
  return () => supabase.removeChannel(channel);
};
```

```dart
// Flutter
void _setupRealtimeSubscription() {
  _channel = _supabase
      .channel('granular-updates')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'items',
        callback: (payload) {
          setState(() {
            _items.add(Item.fromJson(payload.newRecord));
          });
        },
      )
      .onPostgresChanges(
        event: PostgresChangeEvent.update,
        schema: 'public',
        table: 'items',
        callback: (payload) {
          setState(() {
            final index = _items.indexWhere(
              (item) => item.id == payload.newRecord['id']
            );
            if (index != -1) {
              _items[index] = Item.fromJson(payload.newRecord);
            }
          });
        },
      )
      .onPostgresChanges(
        event: PostgresChangeEvent.delete,
        schema: 'public',
        table: 'items',
        callback: (payload) {
          setState(() {
            _items.removeWhere(
              (item) => item.id == payload.oldRecord['id']
            );
          });
        },
      )
      .subscribe();
}
```

### Pattern 4: Presence Tracking

**When to use**: Online/offline status, typing indicators

```typescript
// Web
const channel = supabase.channel('room_01');

// Track presence
channel
  .on('presence', { event: 'sync' }, () => {
    const newState = channel.presenceState();
    setOnlineUsers(Object.keys(newState).length);
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
      });
    }
  });
```

```dart
// Flutter
void _setupPresenceTracking() {
  final channel = _supabase.channel('room_01');
  
  channel
    .onPresenceSync((payload) {
      final presenceState = channel.presenceState();
      setState(() {
        _onlineUsers = presenceState.length;
      });
    })
    .onPresenceJoin((payload) {
      print('User joined: ${payload.key}');
    })
    .onPresenceLeave((payload) {
      print('User left: ${payload.key}');
    })
    .subscribe((status, error) {
      if (status == RealtimeSubscribeStatus.subscribed) {
        channel.track({
          'user_id': _userId,
          'online_at': DateTime.now().toIso8601String(),
        });
      }
    });
}
```

---

## Flutter Implementation Guide

### Step 1: Add Dependencies

`pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.0.0
  flutter_local_notifications: ^16.0.0
  connectivity_plus: ^5.0.0
```

### Step 2: Create Base Realtime Service

`lib/services/base_realtime_service.dart`:
```dart
import 'package:supabase_flutter/supabase_flutter.dart';

abstract class BaseRealtimeService {
  final SupabaseClient supabase = SupabaseConfig.client;
  RealtimeChannel? channel;
  
  /// Override this to set up your specific subscription
  void subscribe();
  
  /// Clean up resources
  Future<void> unsubscribe() async {
    if (channel != null) {
      await supabase.removeChannel(channel!);
      channel = null;
    }
  }
  
  /// Check connection status
  bool get isSubscribed => channel != null;
}
```

### Step 3: Implement Specific Services

Example for appointments:

`lib/services/appointment_realtime_service.dart`:
```dart
class AppointmentRealtimeService extends BaseRealtimeService {
  final String userId;
  final Function() onUpdate;
  
  AppointmentRealtimeService({
    required this.userId,
    required this.onUpdate,
  });
  
  @override
  void subscribe() {
    channel = supabase
        .channel('appointments:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'appointments',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'patient_id',
            value: userId,
          ),
          callback: (_) => onUpdate(),
        )
        .subscribe();
  }
}
```

### Step 4: Use in Widgets with Proper Lifecycle

```dart
class AppointmentsScreen extends StatefulWidget {
  @override
  _AppointmentsScreenState createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> 
    with WidgetsBindingObserver {
  late AppointmentRealtimeService _realtimeService;
  List<Appointment> _appointments = [];
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    
    _realtimeService = AppointmentRealtimeService(
      userId: _currentUserId,
      onUpdate: _fetchAppointments,
    );
    
    _fetchAppointments();
    _realtimeService.subscribe();
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _realtimeService.unsubscribe();
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Handle app lifecycle
    if (state == AppLifecycleState.resumed) {
      // Reconnect when app comes to foreground
      _realtimeService.subscribe();
      _fetchAppointments();
    } else if (state == AppLifecycleState.paused) {
      // Disconnect when app goes to background
      _realtimeService.unsubscribe();
    }
  }
  
  Future<void> _fetchAppointments() async {
    // Fetch data...
  }
  
  @override
  Widget build(BuildContext context) {
    // Build UI...
  }
}
```

### Step 5: Handle Network Changes

`lib/services/connectivity_service.dart`:
```dart
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<ConnectivityResult>? _subscription;
  
  void startMonitoring(Function(bool) onConnectivityChange) {
    _subscription = _connectivity.onConnectivityChanged.listen((result) {
      final isConnected = result != ConnectivityResult.none;
      onConnectivityChange(isConnected);
    });
  }
  
  Future<bool> checkConnection() async {
    final result = await _connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }
  
  void dispose() {
    _subscription?.cancel();
  }
}
```

Use in your app:
```dart
class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final ConnectivityService _connectivityService = ConnectivityService();
  
  @override
  void initState() {
    super.initState();
    _connectivityService.startMonitoring((isConnected) {
      if (isConnected) {
        // Reconnect all realtime services
        _reconnectRealtimeServices();
      } else {
        // Show offline indicator
        _showOfflineMessage();
      }
    });
  }
  
  @override
  void dispose() {
    _connectivityService.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: HomeScreen(),
    );
  }
}
```

---

## Testing & Debugging

### Web Debugging

```typescript
// Enable verbose logging
const channel = supabase
  .channel('debug-channel', {
    config: {
      broadcast: { self: true },
      presence: { key: user.id }
    }
  })
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'my_table' 
  }, (payload) => {
    console.log('Received change:', {
      event: payload.eventType,
      table: payload.table,
      new: payload.new,
      old: payload.old
    });
  })
  .subscribe((status, err) => {
    console.log('Subscription status:', status);
    if (err) console.error('Subscription error:', err);
  });
```

### Flutter Debugging

```dart
// Enable verbose logging
_channel = _supabase
    .channel('debug-channel')
    .onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'my_table',
      callback: (payload) {
        print('=== Realtime Event ===');
        print('Event: ${payload.eventType}');
        print('Table: ${payload.table}');
        print('New: ${payload.newRecord}');
        print('Old: ${payload.oldRecord}');
        print('====================');
      },
    )
    .subscribe((status, error) {
      print('Subscription status: $status');
      if (error != null) {
        print('Subscription error: $error');
      }
    });
```

### Common Issues & Solutions

**Issue 1: Not receiving updates**
- Check RLS policies allow SELECT on the table
- Verify filter syntax is correct
- Ensure table has `REPLICA IDENTITY FULL` enabled

```sql
-- Enable replica identity
ALTER TABLE my_table REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE my_table;
```

**Issue 2: Memory leaks**
- Always unsubscribe in cleanup
- Remove listeners when component unmounts
- Cancel timers and streams

**Issue 3: Duplicate subscriptions**
- Check if you're subscribing multiple times
- Ensure proper cleanup on hot reload (Flutter)
- Use channel name as key to prevent duplicates

---

## Performance Optimization

### 1. Batching Updates

Instead of updating on every change, batch updates:

```dart
class BatchedRealtimeService {
  Timer? _batchTimer;
  bool _hasPendingUpdate = false;
  
  void onRealtimeUpdate() {
    _hasPendingUpdate = true;
    
    // Cancel existing timer
    _batchTimer?.cancel();
    
    // Set new timer (300ms debounce)
    _batchTimer = Timer(Duration(milliseconds: 300), () {
      if (_hasPendingUpdate) {
        _fetchData();
        _hasPendingUpdate = false;
      }
    });
  }
}
```

### 2. Selective Subscriptions

Only subscribe to necessary data:

```dart
// ❌ Bad: Subscribe to all messages
.onPostgresChanges(
  event: PostgresChangeEvent.all,
  schema: 'public',
  table: 'messages',
  callback: (_) => _fetchAllMessages(),
)

// ✅ Good: Subscribe only to relevant conversation
.onPostgresChanges(
  event: PostgresChangeEvent.all,
  schema: 'public',
  table: 'messages',
  filter: PostgresChangeFilter(
    type: PostgresChangeFilterType.eq,
    column: 'conversation_id',
    value: conversationId,
  ),
  callback: (_) => _fetchMessages(),
)
```

### 3. Pagination with Realtime

```dart
class PaginatedRealtimeList {
  List<Item> _items = [];
  int _page = 0;
  int _pageSize = 20;
  bool _hasMore = true;
  
  Future<void> loadMore() async {
    if (!_hasMore) return;
    
    final response = await _supabase
        .from('items')
        .select()
        .range(_page * _pageSize, (_page + 1) * _pageSize - 1)
        .order('created_at', ascending: false);
    
    setState(() {
      _items.addAll(response);
      _hasMore = response.length == _pageSize;
      _page++;
    });
  }
  
  void subscribeToNewItems() {
    // Only prepend new items
    _channel = _supabase
        .channel('new-items')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'items',
          callback: (payload) {
            setState(() {
              _items.insert(0, Item.fromJson(payload.newRecord));
            });
          },
        )
        .subscribe();
  }
}
```

### 4. Connection Pooling

```dart
class RealtimeConnectionManager {
  static final RealtimeConnectionManager _instance = 
      RealtimeConnectionManager._internal();
  factory RealtimeConnectionManager() => _instance;
  RealtimeConnectionManager._internal();
  
  final Map<String, RealtimeChannel> _channels = {};
  
  RealtimeChannel getOrCreateChannel(String name) {
    if (_channels.containsKey(name)) {
      return _channels[name]!;
    }
    
    final channel = SupabaseConfig.client.channel(name);
    _channels[name] = channel;
    return channel;
  }
  
  Future<void> removeChannel(String name) async {
    if (_channels.containsKey(name)) {
      await SupabaseConfig.client.removeChannel(_channels[name]!);
      _channels.remove(name);
    }
  }
  
  Future<void> removeAllChannels() async {
    for (final channel in _channels.values) {
      await SupabaseConfig.client.removeChannel(channel);
    }
    _channels.clear();
  }
}
```

---

## Summary

### Key Takeaways

1. **Use Filters**: Always filter subscriptions to reduce bandwidth
2. **Clean Up**: Always unsubscribe when component unmounts
3. **Handle Reconnection**: Implement reconnection logic for network issues
4. **Optimize Updates**: Use granular updates for large lists
5. **Monitor Performance**: Track subscription count and memory usage

### Checklist for Flutter Implementation

- [ ] Add supabase_flutter dependency
- [ ] Create base realtime service class
- [ ] Implement specific services for each feature
- [ ] Add proper lifecycle management
- [ ] Handle network connectivity changes
- [ ] Implement error handling and retry logic
- [ ] Add loading states and optimistic updates
- [ ] Test on poor network conditions
- [ ] Monitor memory usage
- [ ] Add analytics for realtime events

### Next Steps

1. Review backend-database-integration.md for database setup
2. Review authentication.md for user management
3. Implement realtime services module by module
4. Test thoroughly with multiple devices
5. Monitor and optimize performance

---

## Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Flutter Supabase Package](https://pub.dev/packages/supabase_flutter)
- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)
- [Flutter State Management](https://flutter.dev/docs/development/data-and-backend/state-mgmt)
