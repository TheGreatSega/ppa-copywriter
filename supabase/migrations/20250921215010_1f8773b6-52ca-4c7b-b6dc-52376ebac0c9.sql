-- Create table for tracking API usage and rate limiting
CREATE TABLE public.api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own API usage" 
ON public.api_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API usage" 
ON public.api_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API usage" 
ON public.api_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_api_usage_updated_at
BEFORE UPDATE ON public.api_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX idx_api_usage_user_date ON public.api_usage(user_id, request_date, endpoint);

-- Create function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_daily_limit INTEGER DEFAULT 50
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_usage INTEGER;
BEGIN
  -- Get current usage for today
  SELECT COALESCE(SUM(request_count), 0)
  INTO current_usage
  FROM public.api_usage
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND request_date = CURRENT_DATE;
  
  -- Check if user is within limits
  IF current_usage >= p_daily_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Update or insert usage record
  INSERT INTO public.api_usage (user_id, endpoint, request_count, request_date)
  VALUES (p_user_id, p_endpoint, 1, CURRENT_DATE)
  ON CONFLICT (user_id, endpoint, request_date) 
  DO UPDATE SET 
    request_count = api_usage.request_count + 1,
    updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- Add unique constraint for rate limiting
ALTER TABLE public.api_usage 
ADD CONSTRAINT unique_user_endpoint_date 
UNIQUE (user_id, endpoint, request_date);