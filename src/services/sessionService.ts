import { supabase } from '@/integrations/supabase/client';

export interface BookingData {
  user_id: string;
  expert_id: string;
  service_id: string;
  price_paid: number;
}

export interface SessionInfo {
  bookingId: string;
  sessionStartedAt: string;
  chatEnabled: boolean;
  autoCompletionDate?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
}

export class SessionService {
  // Create a booking and start session immediately
  static async createBooking(bookingData: BookingData): Promise<SessionInfo> {
    try {
      // 1. Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: bookingData.user_id,
          expert_id: bookingData.expert_id,
          service_id: bookingData.service_id,
          price_paid: bookingData.price_paid,
          status: 'confirmed'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // 2. Get service type to determine auto-completion
      const { data: service, error: serviceError } = await supabase
        .from('expert_services')
        .select('service_type')
        .eq('id', bookingData.service_id)
        .single();

      if (serviceError) throw serviceError;

      // 3. Calculate auto-completion date for 1 week/1 month
      let autoCompletionDate: string | null = null;
      if (service.service_type === '1_week') {
        autoCompletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (service.service_type === '1_month') {
        autoCompletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      // 4. Start session immediately (session started = created_at)
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'in_progress',
          auto_completion_date: autoCompletionDate
        })
        .eq('id', booking.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // 5. Create conversation
      await supabase
        .from('conversations')
        .insert({
          user_id: bookingData.user_id,
          expert_id: bookingData.expert_id,
          booking_id: booking.id,
          status: 'active'
        });

      return {
        bookingId: booking.id,
        sessionStartedAt: booking.created_at, // Use created_at as session start
        chatEnabled: updatedBooking.chat_enabled,
        autoCompletionDate: updatedBooking.auto_completion_date,
        status: updatedBooking.status as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  // Check if user can chat with expert
  static async canUserChatWithExpert(userId: string, expertId: string): Promise<boolean> {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('chat_enabled, auto_completion_date, status')
        .eq('user_id', userId)
        .eq('expert_id', expertId)
        .eq('status', 'in_progress')
        .eq('chat_enabled', true)
        .single();

      if (error) throw error;

      if (!booking) return false;

      // Check if session has expired (for 1 week/1 month)
      if (booking.auto_completion_date) {
        const now = new Date();
        const completionDate = new Date(booking.auto_completion_date);
        if (now > completionDate) return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking chat permissions:', error);
      return false;
    }
  }

  // Complete a session (for experts - 30 min and 1 hour only)
  static async completeSession(bookingId: string, expertNotes?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('complete_expert_session', {
        booking_uuid: bookingId,
        expert_notes: expertNotes
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing session:', error);
      return false;
    }
  }

  // Get user's active sessions
  static async getUserActiveSessions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          chat_enabled,
          auto_completion_date,
          status,
          expert_services (
            title,
            service_type
          ),
          profiles!bookings_expert_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .eq('chat_enabled', true);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Get expert's active sessions
  static async getExpertActiveSessions(expertId: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          chat_enabled,
          auto_completion_date,
          status,
          expert_services (
            title,
            service_type
          ),
          profiles!bookings_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('expert_id', expertId)
        .eq('status', 'in_progress')
        .eq('chat_enabled', true);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting expert sessions:', error);
      return [];
    }
  }

  // Auto-complete expired sessions (run daily)
  static async checkAndCompleteExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          chat_enabled: false
        })
        .eq('status', 'in_progress')
        .not('auto_completion_date', 'is', null)
        .lte('auto_completion_date', new Date().toISOString())
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error auto-completing sessions:', error);
      return 0;
    }
  }
} 