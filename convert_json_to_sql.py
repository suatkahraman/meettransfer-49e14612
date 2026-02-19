import json
import datetime

def escape_string(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def format_value(val, col_name=None):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "true" if val else "false"
    if isinstance(val, (int, float)):
        return str(val)
    
    val_str = escape_string(val)
    
    # Cast UUID columns explicitly
    uuid_cols = ['id', 'customer_id', 'driver_id', 'agency_id', 'original_reservation_id']
    if col_name in uuid_cols:
        return f"{val_str}::uuid"
        
    return val_str

def format_array(arr):
    if arr is None:
        return "NULL"
    if not arr:
        return "ARRAY[]::text[]"
    elements = [escape_string(x) for x in arr]
    return "ARRAY[" + ", ".join(elements) + "]"

def main():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON: {e}")
        return

    # Columns list - Removed driver_user_id and agency_user_id
    columns = [
        "id", "reservation_code", "status", "pickup", "dropoff", "pickup_date", "pickup_time",
        "vehicle_type", "customer_name", "customer_phone", "customer_id", "customer_notes",
        "driver_id", "driver_notes", "agency_id",
        "price", "price_currency", "payment_type", "payment_status",
        "passenger_names", "luggage_count", "baby_seat_count",
        "flight_number", "is_return_transfer", "original_reservation_id",
        "driver_earning", "driver_cash", "driver_cash_amount", "driver_confirmed",
        "pickup_lat", "pickup_lng", "pickup_place_name",
        "dropoff_lat", "dropoff_lng", "dropoff_place_name",
        "discount_amount", "discount_percentage", "promo_code",
        "created_at", "updated_at"
    ]

    print(f"INSERT INTO public.reservations ({', '.join(columns)}) VALUES")

    values_list = []
    for item in data:
        row = []
        row.append(format_value(item.get('id'), 'id'))
        row.append(format_value(item.get('reservation_code'), 'reservation_code'))
        row.append(format_value(item.get('status'), 'status'))
        row.append(format_value(item.get('pickup'), 'pickup'))
        row.append(format_value(item.get('dropoff'), 'dropoff'))
        row.append(format_value(item.get('pickup_date'), 'pickup_date'))
        row.append(format_value(item.get('pickup_time'), 'pickup_time'))
        row.append(format_value(item.get('vehicle_type'), 'vehicle_type'))
        row.append(format_value(item.get('customer_name'), 'customer_name'))
        row.append(format_value(item.get('customer_phone'), 'customer_phone'))
        row.append(format_value(item.get('customer_id'), 'customer_id'))
        row.append(format_value(item.get('customer_notes'), 'customer_notes'))
        row.append(format_value(item.get('driver_id'), 'driver_id'))
        # Removed driver_user_id
        row.append(format_value(item.get('driver_notes'), 'driver_notes'))
        row.append(format_value(item.get('agency_id'), 'agency_id'))
        # Removed agency_user_id
        row.append(format_value(item.get('price'), 'price'))
        row.append(format_value(item.get('price_currency'), 'price_currency'))
        row.append(format_value(item.get('payment_type'), 'payment_type'))
        row.append(format_value(item.get('payment_status'), 'payment_status'))
        row.append(format_array(item.get('passenger_names')))
        row.append(format_value(item.get('luggage_count'), 'luggage_count'))
        row.append(format_value(item.get('baby_seat_count'), 'baby_seat_count'))
        row.append(format_value(item.get('flight_number'), 'flight_number'))
        row.append(format_value(item.get('is_return_transfer'), 'is_return_transfer'))
        row.append(format_value(item.get('original_reservation_id'), 'original_reservation_id'))
        row.append(format_value(item.get('driver_earning'), 'driver_earning'))
        row.append(format_value(item.get('driver_cash'), 'driver_cash'))
        row.append(format_value(item.get('driver_cash_amount'), 'driver_cash_amount'))
        row.append(format_value(item.get('driver_confirmed'), 'driver_confirmed'))
        row.append(format_value(item.get('pickup_lat'), 'pickup_lat'))
        row.append(format_value(item.get('pickup_lng'), 'pickup_lng'))
        row.append(format_value(item.get('pickup_place_name'), 'pickup_place_name'))
        row.append(format_value(item.get('dropoff_lat'), 'dropoff_lat'))
        row.append(format_value(item.get('dropoff_lng'), 'dropoff_lng'))
        row.append(format_value(item.get('dropoff_place_name'), 'dropoff_place_name'))
        row.append(format_value(item.get('discount_amount'), 'discount_amount'))
        row.append(format_value(item.get('discount_percentage'), 'discount_percentage'))
        row.append(format_value(item.get('promo_code'), 'promo_code'))
        row.append(format_value(item.get('created_at'), 'created_at'))
        row.append(format_value(item.get('updated_at'), 'updated_at'))
        
        values_list.append("(" + ", ".join(row) + ")")

    print(",\n".join(values_list))
    print("ON CONFLICT (id) DO NOTHING;")

if __name__ == "__main__":
    main()
