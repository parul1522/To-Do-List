import tkinter as tk
from tkinter import messagebox
from pygame import mixer
from tkinter import font

mixer.init()
try:
    sound_effect=mixer.Sound("sound.wav")
except Exception as e:
    print(f"Error loading sound: {e}. Make sure 'sound.wav' exists.")
    exit()

root=tk.Tk()

root.title("TO-DO LIST")
root.geometry("300x450")
root.config(bg="#eefafe")
# root.resizable(False,False)

task_list=[]

def play_sound():
    sound_effect.play()

def enter():
    task=e1.get()
    if task:
        task_list.insert(tk.END,"⇒"+task)
        e1.delete(0,tk.END)
        play_sound()
    else:
        messagebox.showwarning("You didnt type anything")
    pass
    
def delete():
    task_list.itemconfig(
        task_list.curselection(),
        fg="#dedede"
    )
    task_list.selection_clear(0,'end')
    play_sound()
    pass

def uncross_item():
    task_list.itemconfig(
        task_list.curselection(),
        fg="#070505"
    )
    task_list.selection_clear(0,'end')
    play_sound()
    pass
def clear_field():
    task_list.delete(0,tk.END)
    play_sound()
    pass

list1=[]

title_label = tk.Label(root, text="My To-Do List ", font=("Comic Sans MS", 16), bg="#eefafe", fg="#333")
title_label.pack(pady=8)

e1=tk.Entry(root,font=("Arial",10),width=28,bd=2)
e1.pack(pady=5)

Button=tk.Button(root,text='Add Task',font=("Comic Sans MS",10),width=12,bg="#f9f9f9",borderwidth=1,command=enter)
Button.pack(pady=4)

frame = tk.Frame(root)
frame.pack(padx=8, pady=6, fill="both", expand=True)
scrollbar=tk.Scrollbar(frame)
task_list=tk.Listbox(frame,yscrollcommand=scrollbar.set,width=34,height=8,font=("Comic Sans MS",11),bg="#f9f9f9",borderwidth=1)
scrollbar.config(command=task_list.yview)
scrollbar.pack(side="right",fill="y")
task_list.pack(padx=8,pady=6,side="left",fill="both",expand=True)
task_list.config(yscrollcommand=scrollbar.set)

Button2=tk.Button(root,text='Delete Task',font=("Comic Sans MS",10),width=12,bg="#f9f9f9",borderwidth=1,command=delete)
Button2.pack(pady=4)
Button3=tk.Button(root,text='Clear Page',font=("Comic Sans MS",10),width=12,bg="#f9f9f9",borderwidth=1,command=clear_field)
Button3.pack(pady=4)
Button4=tk.Button(root,text='Uncross',font=("Comic Sans MS",10),width=12,bg="#f9f9f9",borderwidth=1,command=uncross_item)
Button4.pack(pady=4)

root.mainloop()