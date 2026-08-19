import React, { useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { MoreVert } from "@mui/icons-material";

interface Props {
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const ActionMenu: React.FC<Props> = ({ onView, onEdit, onDelete }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreVert fontSize="small" />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                        onView();
                    }}
                >
                    View
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                        onEdit();
                    }}
                >
                    Edit
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                        onDelete();
                    }}
                    style={{ color: "red" }}
                >
                    Delete
                </MenuItem>
            </Menu>
        </>
    );
};

export default ActionMenu;
