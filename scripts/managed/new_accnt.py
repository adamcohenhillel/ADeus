from time import sleep
import secrets

import supabase


MAIN_SUPABASE_URL = ""
MAIN_SUPABASE_SERVICE_ROLE = ""
MAIN_SUPABASE_CLIENT = supabase.create_client(MAIN_SUPABASE_URL, MAIN_SUPABASE_SERVICE_ROLE)


def get_latest_account_number():
    latest_account = MAIN_SUPABASE_CLIENT.auth.admin.list_users()[0]
    if latest_account is None:
        return 1
    if not "account_number" in latest_account.user_metadata:
        return 1
    else:
        return latest_account.user_metadata["account_number"]

def main():
    user_real_email = input("Enter user real email: ")

    new_account_number = get_latest_account_number() + 1
    formatted_number = str(new_account_number).zfill(4)
    email = f'{formatted_number}@adeus.ai'
    password = secrets.token_urlsafe(13)

    res = MAIN_SUPABASE_CLIENT.auth.admin.create_user(
        attributes={
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "account_number": new_account_number,
                "user_real_email": user_real_email
            }
        }
    )
    

    print("\n\n\n\n\n\n--------------\nDetails: ")
    print(f"EMAIL: {email}")
    print(f"PASS: {password}")
    print("--------------\n\n\n\n\n\n\n")


if __name__ == "__main__":
    main()