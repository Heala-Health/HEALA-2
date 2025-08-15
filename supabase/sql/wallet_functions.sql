-- Credit wallet function
CREATE OR REPLACE FUNCTION credit_wallet(
  wallet_id_param UUID,
  amount_param NUMERIC(10,2),
  description_param TEXT,
  reference_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  current_balance NUMERIC(10,2);
  new_balance NUMERIC(10,2);
  transaction_id UUID;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance 
  FROM wallets 
  WHERE id = wallet_id_param;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance + amount_param;
  
  -- Update wallet balance
  UPDATE wallets 
  SET balance = new_balance, updated_at = NOW()
  WHERE id = wallet_id_param;
  
  -- Insert transaction record
  INSERT INTO wallet_transactions (
    wallet_id, transaction_type, amount, balance_after, 
    description, reference_id, status
  ) VALUES (
    wallet_id_param, 'credit', amount_param, new_balance,
    description_param, reference_param, 'completed'
  ) RETURNING id INTO transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'new_balance', new_balance
  );
END;
$$ LANGUAGE plpgsql;

-- Debit wallet function
CREATE OR REPLACE FUNCTION debit_wallet(
  wallet_id_param UUID,
  amount_param NUMERIC(10,2),
  description_param TEXT,
  reference_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  current_balance NUMERIC(10,2);
  new_balance NUMERIC(10,2);
  transaction_id UUID;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance 
  FROM wallets 
  WHERE id = wallet_id_param;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF current_balance < amount_param THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - amount_param;
  
  -- Update wallet balance
  UPDATE wallets 
  SET balance = new_balance, updated_at = NOW()
  WHERE id = wallet_id_param;
  
  -- Insert transaction record
  INSERT INTO wallet_transactions (
    wallet_id, transaction_type, amount, balance_after, 
    description, reference_id, status
  ) VALUES (
    wallet_id_param, 'debit', amount_param, new_balance,
    description_param, reference_param, 'completed'
  ) RETURNING id INTO transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'new_balance', new_balance
  );
END;
$$ LANGUAGE plpgsql;

-- Transfer funds function
CREATE OR REPLACE FUNCTION transfer_funds(
  from_wallet_id UUID,
  to_wallet_id UUID,
  amount_param NUMERIC(10,2),
  description_param TEXT
)
RETURNS JSON AS $$
DECLARE
  from_balance NUMERIC(10,2);
  to_balance NUMERIC(10,2);
  new_from_balance NUMERIC(10,2);
  new_to_balance NUMERIC(10,2);
  from_transaction_id UUID;
  to_transaction_id UUID;
BEGIN
  -- Get current balances
  SELECT balance INTO from_balance FROM wallets WHERE id = from_wallet_id;
  SELECT balance INTO to_balance FROM wallets WHERE id = to_wallet_id;
  
  IF from_balance IS NULL OR to_balance IS NULL THEN
    RAISE EXCEPTION 'One or both wallets not found';
  END IF;
  
  IF from_balance < amount_param THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Calculate new balances
  new_from_balance := from_balance - amount_param;
  new_to_balance := to_balance + amount_param;
  
  -- Update both wallets
  UPDATE wallets SET balance = new_from_balance, updated_at = NOW() WHERE id = from_wallet_id;
  UPDATE wallets SET balance = new_to_balance, updated_at = NOW() WHERE id = to_wallet_id;
  
  -- Insert debit transaction
  INSERT INTO wallet_transactions (
    wallet_id, transaction_type, amount, balance_after, description, status
  ) VALUES (
    from_wallet_id, 'debit', amount_param, new_from_balance, description_param, 'completed'
  ) RETURNING id INTO from_transaction_id;
  
  -- Insert credit transaction
  INSERT INTO wallet_transactions (
    wallet_id, transaction_type, amount, balance_after, description, status
  ) VALUES (
    to_wallet_id, 'credit', amount_param, new_to_balance, description_param, 'completed'
  ) RETURNING id INTO to_transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'from_transaction_id', from_transaction_id,
    'to_transaction_id', to_transaction_id,
    'from_balance', new_from_balance,
    'to_balance', new_to_balance
  );
END;
$$ LANGUAGE plpgsql;

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  bank_details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);