from fastapi import FastAPI, HTTPException
import databases
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional
import os
from fastapi.middleware.cors import CORSMiddleware

# source venv/bin/activate
# uvicorn main:app --reload
# npm run dev
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

database = databases.Database(DATABASE_URL)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models ---
class TeamCreate(BaseModel):
    team_name: str
    project_name: Optional[str] = None

class TeamUpdate(BaseModel):
    team_name: Optional[str] = None
    project_name: Optional[str] = None

# --- Startup/Shutdown ---
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# --- Routes ---
@app.get("/")
async def root():
    return {"message": "Dashboard API is running!"}







# --- Users Models ---
class UserCreate(BaseModel):
    full_name: str
    email: str
    role_id: Optional[int] = None
    team_id: Optional[int] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role_id: Optional[int] = None
    team_id: Optional[int] = None

@app.post("/register")
async def register_user(user: UserCreate):
    # Check if email already exists
    check_query = "SELECT * FROM users WHERE email = :email"
    existing = await database.fetch_one(check_query, values={"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    query = """
        INSERT INTO users (full_name, email, role_id, team_id)
        VALUES (:full_name, :email, :role_id, :team_id)
        RETURNING *
    """
    return await database.fetch_one(query, values=user.dict())


# --- Users Routes ---
@app.get("/users")
async def get_users():
    query = "SELECT * FROM users"
    return await database.fetch_all(query)

@app.post("/users")
async def create_user(user: UserCreate):
    query = """
        INSERT INTO users (full_name, email, role_id, team_id)
        VALUES (:full_name, :email, :role_id, :team_id)
        RETURNING *
    """
    return await database.fetch_one(query, values=user.dict())

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    query = "SELECT * FROM users WHERE id = :user_id"
    user = await database.fetch_one(query, values={"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}")
async def update_user(user_id: str, user: UserUpdate):
    query = """
        UPDATE users
        SET full_name = COALESCE(:full_name, full_name),
            email = COALESCE(:email, email),
            role_id = COALESCE(:role_id, role_id),
            team_id = CASE WHEN :team_id_set THEN :team_id ELSE team_id END
        WHERE id = :user_id
        RETURNING *
    """
    values = {
        **user.dict(),
        "user_id": user_id,
        "team_id_set": "team_id" in user.dict(exclude_unset=True)
    }
    updated = await database.fetch_one(query, values=values)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@app.delete("/users/{user_id}")
async def delete_user(user_id: str):
    query = "DELETE FROM users WHERE id = :user_id RETURNING *"
    deleted = await database.fetch_one(query, values={"user_id": user_id})
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# --- Assign role to a user ---
class RoleAssignment(BaseModel):
    role_id: int

@app.put("/users/{user_id}/assign-role")
async def assign_role_to_user(user_id: str, assignment: RoleAssignment):
    query = """
        UPDATE users SET role_id = :role_id WHERE id = :user_id RETURNING *
    """
    updated = await database.fetch_one(query, values={"role_id": assignment.role_id, "user_id": user_id})
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"Role assigned successfully", "user": updated}


# --- Teams routes ---
@app.get("/teams")
async def get_teams():
    query = "SELECT * FROM teams"
    return await database.fetch_all(query)

@app.post("/teams")
async def create_team(team: TeamCreate, creator_id: Optional[str] = None):
    # Check if team name already exists
    check_query = "SELECT * FROM teams WHERE LOWER(team_name) = LOWER(:team_name)"
    existing = await database.fetch_one(check_query, values={"team_name": team.team_name})
    if existing:
        raise HTTPException(status_code=400, detail="A team with this name already exists")

    query = """
        INSERT INTO teams (team_name, project_name)
        VALUES (:team_name, :project_name)
        RETURNING *
    """
    new_team = await database.fetch_one(query, values=team.dict())

    if creator_id:
        await database.execute(
            "UPDATE users SET team_id = :team_id WHERE id = :user_id",
            values={"team_id": new_team["id"], "user_id": creator_id}
        )

    return new_team




@app.get("/teams/{team_id}")
async def get_team(team_id: int):
    query = "SELECT * FROM teams WHERE id = :team_id"
    team = await database.fetch_one(query, values={"team_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@app.put("/teams/{team_id}")
async def update_team(team_id: int, team: TeamUpdate):
    # Check if new name already exists on a different team
    if team.team_name:
        check_query = "SELECT * FROM teams WHERE LOWER(team_name) = LOWER(:team_name) AND id != :team_id"
        existing = await database.fetch_one(check_query, values={"team_name": team.team_name, "team_id": team_id})
        if existing:
            raise HTTPException(status_code=400, detail="A team with this name already exists")

    query = """
        UPDATE teams
        SET team_name = COALESCE(:team_name, team_name),
            project_name = COALESCE(:project_name, project_name)
        WHERE id = :team_id
        RETURNING *
    """
    values = {**team.dict(), "team_id": team_id}
    updated = await database.fetch_one(query, values=values)
    if not updated:
        raise HTTPException(status_code=404, detail="Team not found")
    return updated

@app.delete("/teams/{team_id}")
async def delete_team(team_id: int):
    query = "DELETE FROM teams WHERE id = :team_id RETURNING *"
    deleted = await database.fetch_one(query, values={"team_id": team_id})
    if not deleted:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"message": "Team deleted successfully"}
@app.put("/teams/{team_id}/toggle-closed")
async def toggle_team_closed(team_id: int):
    query = """
        UPDATE teams
        SET is_closed = NOT is_closed
        WHERE id = :team_id
        RETURNING *
    """
    updated = await database.fetch_one(query, values={"team_id": team_id})
    if not updated:
        raise HTTPException(status_code=404, detail="Team not found")
    return updated


# --- Assigning users to teams ---
class TeamAssignment(BaseModel):
    user_ids: list[str]

@app.put("/teams/{team_id}/assign")
async def assign_users_to_team(team_id: int, assignment: TeamAssignment):
    for user_id in assignment.user_ids:
        query = """
            UPDATE users SET team_id = :team_id WHERE id = :user_id
        """
        await database.execute(query, values={"team_id": team_id, "user_id": user_id})
    return {"message": f"{len(assignment.user_ids)} users assigned to team {team_id}"}

@app.post("/teams/{team_id}/join")
async def join_team(team_id: int, user_id: str):
    # Check if team is closed
    check_query = "SELECT * FROM teams WHERE id = :team_id"
    team = await database.fetch_one(check_query, values={"team_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team["is_closed"]:
        raise HTTPException(status_code=403, detail="This team is closed")
    
    query = "UPDATE users SET team_id = :team_id WHERE id = :user_id RETURNING *"
    updated = await database.fetch_one(query, values={"team_id": team_id, "user_id": user_id})
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

# --- Roles Models ---
class RoleCreate(BaseModel):
    role_name: str
    permission_level: Optional[int] = 1

# --- Roles Routes ---
@app.get("/roles")
async def get_roles():
    query = "SELECT * FROM roles"
    return await database.fetch_all(query)

@app.post("/roles")
async def create_role(role: RoleCreate):
    query = """
        INSERT INTO roles (role_name, permission_level)
        VALUES (:role_name, :permission_level)
        RETURNING *
    """
    return await database.fetch_one(query, values=role.dict())

@app.delete("/roles/{role_id}")
async def delete_role(role_id: int):
    query = "DELETE FROM roles WHERE id = :role_id RETURNING *"
    deleted = await database.fetch_one(query, values={"role_id": role_id})
    if not deleted:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"message": "Role deleted successfully"}

class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
    permission_level: Optional[int] = None

@app.put("/roles/{role_id}")
async def update_role(role_id: int, role: RoleUpdate):
    query = """
        UPDATE roles
        SET role_name = COALESCE(:role_name, role_name),
            permission_level = COALESCE(:permission_level, permission_level)
        WHERE id = :role_id
        RETURNING *
    """
    updated = await database.fetch_one(query, values={**role.dict(), "role_id": role_id})
    if not updated:
        raise HTTPException(status_code=404, detail="Role not found")
    return updated


# --- Help Request Models ---
class HelpRequestCreate(BaseModel):
    team_id: int
    created_by: Optional[str] = None
    type_of_help: Optional[str] = None
    description: Optional[str] = None
    is_private: Optional[bool] = False

class HelpRequestUpdate(BaseModel):
    status: Optional[str] = None
    type_of_help: Optional[str] = None
    description: Optional[str] = None

# --- Help Request Routes ---

@app.get("/help-requests/team/{team_id}")
async def get_team_help_requests(team_id: int):
    query = "SELECT * FROM help_requests WHERE team_id = :team_id ORDER BY created_at DESC"
    return await database.fetch_all(query, values={"team_id": team_id})

@app.get("/help-requests")
async def get_help_requests():
    query = "SELECT * FROM help_requests"
    return await database.fetch_all(query)

@app.get("/help-requests/{request_id}")
async def get_help_request(request_id: str):
    query = "SELECT * FROM help_requests WHERE id = :request_id"
    return await database.fetch_one(query, values={"request_id": request_id})



@app.post("/help-requests")
async def create_help_request(request: HelpRequestCreate):
    query = """
        INSERT INTO help_requests (team_id, created_by, type_of_help, description, is_private)
        VALUES (:team_id, :created_by, :type_of_help, :description, :is_private)
        RETURNING *
    """
    return await database.fetch_one(query, values=request.dict())

@app.put("/help-requests/{request_id}")
async def update_help_request(request_id: str, request: HelpRequestUpdate):
    query = """
        UPDATE help_requests
        SET status = COALESCE(:status, status),
            type_of_help = COALESCE(:type_of_help, type_of_help),
            description = COALESCE(:description, description)
        WHERE id = :request_id
        RETURNING *
    """
    values = {**request.dict(), "request_id": request_id}
    updated = await database.fetch_one(query, values=values)
    if not updated:
        raise HTTPException(status_code=404, detail="Help request not found")
    return updated

@app.delete("/help-requests/{request_id}")
async def delete_help_request(request_id: str):
    query = "DELETE FROM help_requests WHERE id = :request_id RETURNING *"
    deleted = await database.fetch_one(query, values={"request_id": request_id})
    if not deleted:
        raise HTTPException(status_code=404, detail="Help request not found")
    return {"message": "Help request deleted successfully"}

class ReplyCreate(BaseModel):
    help_request_id: str
    user_id: Optional[str] = None
    message: str

@app.get("/help-requests/{request_id}/replies")
async def get_replies(request_id: str):
    query = """
        SELECT r.*, u.full_name, ro.role_name
        FROM help_request_replies r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN roles ro ON u.role_id = ro.id
        WHERE r.help_request_id = :request_id
        ORDER BY r.created_at ASC
    """
    return await database.fetch_all(query, values={"request_id": request_id})

@app.post("/help-requests/{request_id}/replies")
async def create_reply(request_id: str, reply: ReplyCreate):
    query = """
        INSERT INTO help_request_replies (help_request_id, user_id, message)
        VALUES (:help_request_id, :user_id, :message)
        RETURNING *
    """
    return await database.fetch_one(query, values=reply.dict())


# --- Progress Models ---
class ProgressCreate(BaseModel):
    team_id: int
    status_label: Optional[str] = None
    comment: Optional[str] = None

# --- Progress Routes ---
@app.get("/progress")
async def get_all_progress():
    query = "SELECT * FROM progress"
    return await database.fetch_all(query)

@app.get("/progress/team/{team_id}")
async def get_team_progress(team_id: int):
    query = "SELECT * FROM progress WHERE team_id = :team_id ORDER BY created_at DESC"
    return await database.fetch_all(query, values={"team_id": team_id})

@app.post("/progress")
async def create_progress(progress: ProgressCreate):
    query = """
        INSERT INTO progress (team_id, status_label, comment)
        VALUES (:team_id, :status_label, :comment)
        RETURNING *
    """
    return await database.fetch_one(query, values=progress.dict())

@app.delete("/progress/{progress_id}")
async def delete_progress(progress_id: int):
    query = "DELETE FROM progress WHERE id = :progress_id RETURNING *"
    deleted = await database.fetch_one(query, values={"progress_id": progress_id})
    if not deleted:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    return {"message": "Progress entry deleted successfully"}